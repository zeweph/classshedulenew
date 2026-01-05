const autoGenerateSchedule = async (req, res) => {
  const { scheduleData } = req.body;

  if (!scheduleData) {
    return res.status(400).json({ error: "Missing scheduleData" });
  }

  const { batch_id, semester_id, section, department_id } = scheduleData;

  if (!batch_id || !semester_id || !section || !department_id) {
    return res.status(400).json({
      error: "batch_id, semester_id, section, department_id are required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    /* ----------------------------------------------------
       1. Move existing published schedule to draft
    ----------------------------------------------------- */
    await client.query(
      `UPDATE schedules
       SET status='draft', updated_at=NOW()
       WHERE batch_id=$1
         AND semester_id=$2
         AND section=$3
         AND department_id=$4
         AND status='published'`,
      [batch_id, semester_id, section, department_id]
    );

    /* ----------------------------------------------------
       2. Create new schedule
    ----------------------------------------------------- */
    const schedRes = await client.query(
      `INSERT INTO schedules
       (department_id, batch_id, semester_id, section, status)
       VALUES ($1,$2,$3,$4,'published')
       RETURNING id`,
      [department_id, batch_id, semester_id, section]
    );

    const scheduleId = schedRes.rows[0].id;

    /* ----------------------------------------------------
       3. Create day_schedules
    ----------------------------------------------------- */
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayMap = {}; // dayName -> day_schedule_id

    for (const day of DAYS) {
      const d = await client.query(
        `INSERT INTO day_schedules (schedule_id, day_of_week)
         VALUES ($1,$2) RETURNING id`,
        [scheduleId, day]
      );
      dayMap[day] = d.rows[0].id;
    }

    /* ----------------------------------------------------
       4. Fetch all courses for batch & semester
    ----------------------------------------------------- */
    const coursesRes = await client.query(
      `SELECT cb.course_id, c.course_name
       FROM course_batch cb
       JOIN course c ON cb.course_id = c.course_id
       WHERE cb.department_id=$1
         AND cb.batch=$2
         AND cb.semester_id=$3
       ORDER BY c.course_id`,
      [department_id, batch_id, semester_id]
    );

    if (coursesRes.rowCount === 0) {
      throw new Error("No courses found for this batch & semester");
    }

    /* ----------------------------------------------------
       5. Fetch available rooms
    ----------------------------------------------------- */
    const roomsRes = await client.query(
      `SELECT r.room_id, sr.room_type
       FROM section_rooms sr
       JOIN rooms r ON sr.room_id=r.room_id
       WHERE sr.department_id=$1 AND
         sr.batch_id=$2 AND sr.section=$3
         AND r.is_available=true`,
      [department_id,batch_id, section]
    );

    if (roomsRes.rowCount === 0) {
      throw new Error("No available rooms for this section");
    }

    /* ----------------------------------------------------
       6. Fetch time slots (NO day_of_week)
    ----------------------------------------------------- */
    const slotsRes = await client.query(
      `SELECT start_time, end_time, slot_type
       FROM time_slots
       WHERE department_id=$1
         AND is_active=true
       ORDER BY start_time`,
      [department_id]
    );

    if (slotsRes.rowCount === 0) {
      throw new Error("No active time slots found");
    }

    /* ----------------------------------------------------
       7. Tracking helpers
    ----------------------------------------------------- */
    const assignments = []; // conflict tracking
    const dayCount = {};    // day_schedule_id -> number
    const courseUsage = {}; // day_schedule_id -> Set(course_id)
    const MIN_CLASSES_PER_DAY = 2;

    /* ----------------------------------------------------
       8. Auto Scheduling Logic
    ----------------------------------------------------- */
    for (const [dayName, dayScheduleId] of Object.entries(dayMap)) {

      dayCount[dayScheduleId] = 0;
      courseUsage[dayScheduleId] = new Set();

      for (const slot of slotsRes.rows) {

        if (slot.slot_type === "break") continue;

        // Prevent same time repeat on same day
        const timeUsed = assignments.find(a =>
          a.dayScheduleId === dayScheduleId &&
          a.start === slot.start_time &&
          a.end === slot.end_time
        );
        if (timeUsed) continue;

        let placed = false;

        for (const course of coursesRes.rows) {

          // ❌ prevent same course twice in same day
          if (courseUsage[dayScheduleId].has(course.course_id)) continue;

          const instructorsRes = await client.query(
            `SELECT cia.instructor_id
             FROM course_instructor_assign cia
             JOIN users u ON cia.instructor_id=u.id
             WHERE cia.course_id=$1
               AND u.status='Active'`,
            [course.course_id]
          );

          if (instructorsRes.rowCount === 0) continue;

          for (const room of roomsRes.rows) {
            for (const inst of instructorsRes.rows) {

              // Instructor or room conflict
              const conflict = assignments.find(a =>
                a.dayScheduleId === dayScheduleId &&
                a.start === slot.start_time &&
                a.end === slot.end_time &&
                (a.room === room.room_id ||
                 a.instructor === inst.instructor_id)
              );

              if (conflict) continue;
         const result = await client.query(
              `SELECT s.*, dc.*, c.course_name, u.full_name, 
                      b.block_name, b.block_code, r.room_number, dw.day_of_week
               FROM day_courses dc
               JOIN course c ON dc.course_id = c.course_id
               JOIN day_schedules dw ON dc.day_schedule_id = dw.id
               JOIN schedules s ON dw.schedule_id=s.id
               JOIN users u ON dc.instructor_id = u.id
               JOIN rooms r ON dc.room_id = r.room_id
               JOIN blocks b ON r.block_id = b.block_id
               WHERE dc.room_id=$1
                  AND dc.start_time = $2 
                  AND dc.end_time = $3
                  AND dw.day_of_week = $4 
                  AND s.status='published'`,
              [
                room.room_id,
                slot.startTime,
                slot.endTime,
                dayName
              ]
            );

            if (result.rows.length > 0 && result.rows[0].instructor_id == inst.instructor_id) {
              continue;
            } else if (result.rows.length > 0) {
              continue;
            }
              // INSERT
              await client.query(
                `INSERT INTO day_courses
                 (day_schedule_id, course_id, room_id, instructor_id, start_time, end_time)
                 VALUES ($1,$2,$3,$4,$5,$6)`,
                [
                  dayScheduleId,
                  course.course_id,
                  room.room_id,
                  inst.instructor_id,
                  slot.start_time,
                  slot.end_time,
                ]
              );

              assignments.push({
                dayScheduleId,
                start: slot.start_time,
                end: slot.end_time,
                room: room.room_id,
                instructor: inst.instructor_id,
              });

              courseUsage[dayScheduleId].add(course.course_id);
              dayCount[dayScheduleId]++;
              placed = true;
              break;
            }
            if (placed) break;
          }
          if (placed) break;
        }
      }
    }

    /* ----------------------------------------------------
       9. Validate minimum per day
    ----------------------------------------------------- */
    for (const [dayScheduleId, count] of Object.entries(dayCount)) {
      if (count < MIN_CLASSES_PER_DAY) {
        throw new Error(
          `A day has only ${count} classes. Minimum required is ${MIN_CLASSES_PER_DAY}.`
        );
      }
    }

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Schedule auto-generated successfully",
      schedule_id: scheduleId,
      total_courses: coursesRes.rowCount,
      total_assignments: assignments.length,
    });

  } catch (err) {
    await client.query("ROLLBACK");
  console.error("Auto-generate error:", err);
  return res.status(400).json({
    error: err.message || "Auto schedule generation failed",
  });
  } finally {
    client.release();
  }
};
function generateTimeSlots(timslot) {
  const slots = [];

  const BREAK_START = "6:30";
  const BREAK_END = "7:30";

  for (const row of timslot.rows) {
    const dayStart = row.start_time;
    const dayEnd = row.end_time;
    const totalHours = diffHours(dayStart, dayEnd);
    const lectureEnd = addHours(dayStart, Math.floor(totalHours / 2));
    console.log("Lecture end:", lectureEnd);
    console.log('start', row.start_time);
    console.log('end', row.end_time);
    /* ---------- LECTURE SLOTS (MORNING) ---------- */
    let lecTime = addHours(dayStart, 0);
    while (timeLessThan(addHours(lecTime, row.lecture_duration), lectureEnd)) {
      console.log('lect', row.lecture_duration);
      const slotStart = lecTime;
      const slotEnd = addHours(lecTime, row.lecture_duration);
      // ⏸ Skip if overlaps lunch/prayer break
      if (!(slotEnd <= BREAK_START || slotStart <= BREAK_END)) {
        lecTime = BREAK_END; // jump past break
        continue;
      }

      slots.push({
        start_time: slotStart,
        end_time: slotEnd,
        slot_type: "LEC"
      });

      lecTime = slotEnd;
    }

    /* ---------- LAB SLOTS (AFTERNOON) ---------- */
    console.log("Trying LEC slot:", lecTime, addHours(lecTime, row.lecture_duration));

    let labTime = BREAK_END;

    while (
      row.labratory_duration > 0 &&
      timeLessThan(addHours(labTime, row.labratory_duration), dayEnd)
    ) {
      const slotStart = labTime;
      const slotEnd = addHours(labTime, row.labratory_duration);

      // ⏸ Skip if overlaps lunch/prayer break
      if (!(slotEnd <= BREAK_START || slotStart >= BREAK_END)) {
        labTime = BREAK_END; // jump past break
        continue;
      }

      slots.push({
        start_time: slotStart,
        end_time: slotEnd,
        slot_type: "LAB"
      });

      labTime = slotEnd;
    }
  }

  return slots;
}