import  pool from "../db";


const autoGenerateSchedule = async (req, res) => {
  const batch_id=1, semester_id=1, section='A', department_id=2
  const client = await pool.connect();
 
  const MAX_INSTRUCTOR_LOAD = 6;
  const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
  const conflictReport = [];
  const assignments = [];

  try {
    await client.query("BEGIN");
      await client.query(
      "UPDATE schedules SET status='draft' WHERE batch_id=$1 and semester_id=$2 and section=$3 and status='published' and department_id=$4",
      [batch_id, semester_id, section, department_id]
    ); 


    /* ---------------- CREATE SCHEDULE ---------------- */
    const schedRes = await client.query(
      `INSERT INTO schedules (department_id, batch_id, semester_id, section, status)
       VALUES ($1,$2,$3,$4,'published')
       RETURNING id`,
      [department_id, batch_id, semester_id, section]
    );
    const scheduleId = schedRes.rows[0].id;

    /* ---------------- DAYS ---------------- */
    const dayMap = {};
    for (const day of DAYS) {
      const d = await client.query(
        `INSERT INTO day_schedules (schedule_id, day_of_week)
         VALUES ($1,$2) RETURNING id`,
        [scheduleId, day]
      );
      dayMap[day] = d.rows[0].id;
    }
   const timslot = await client.query(
    `SELECT * FROM time_slots
     WHERE department_id = $1`,
    [department_id]
    );
    /* ---------------- SLOTS ---------------- */
    const slots = await generateTimeSlots(timslot); // smart + break included
    console.log('time slote', slots);
    
    /* ---------------- COURSES ---------------- */
          const coursesRes = await client.query(
          `SELECT 
            c.course_id,
            c.lec_hr,
            c.tut_hr,
            c.lab_hr
          FROM course_batch cb
          JOIN course c ON cb.course_id = c.course_id
          WHERE cb.department_id = $1
            AND cb.batch = $2
            AND cb.semester_id = $3`,
          [department_id, batch_id, semester_id]
    );
  
    /* ---------------- ROOMS ---------------- */
    const roomsRes = await client.query(
      `SELECT r.room_id, r.room_type
       FROM section_rooms sr
       JOIN rooms r ON sr.room_id=r.room_id
       WHERE sr.department_id=$1 AND
         sr.batch_id=$2 AND sr.section=$3
         AND r.is_available=true`,
      [department_id, batch_id, section]
    );
   
    /* ---------------- PREPARE SESSIONS ---------------- */
    const allSessions = [];
    for (const course of coursesRes.rows) {
      allSessions.push(...calculateCourseSessions(course, timslot));
    }
    const totalLectureTutorial = (allSessions.filter(s => s.type === 'LEC').length)*timslot.rows[0].lecture_duration;
    const  totalLab=(allSessions.filter(s => s.type === 'LAB').length)*timslot.rows[0].labratory_duration;

        console.log("Total Lecture + Tutorial Hours:", totalLectureTutorial);
        console.log("Total Lab Hours:", totalLab);
        console.log("All course", allSessions);
    
    const courseDayUsage = {};
    let k = 0;

    /* ---------------- SCHEDULER ---------------- */
    for (const session of allSessions) {
     
      let placed = false;
      // Smart scheduling: try LEC first, then LAB
      const filteredSlots = slots.filter(s => s.slot_type === session.type);
      for (const [dayName, dayScheduleId] of Object.entries(dayMap)) {
        courseDayUsage[dayScheduleId] ??= new Set();
        if (courseDayUsage[dayScheduleId].has(session.course_id)) continue;
        for (const slot of filteredSlots) {
          for (const room of roomsRes.rows) {
            // 🧪 Room type check
            if ((session.type === "LAB" && room.room_type === "classroom") || (session.type === "LEC" && room.room_type === "lab")) continue;
            //  Instructor for THIS course only
            const instRes = await client.query(
              `SELECT instructor_id
               FROM course_instructor_assign
               WHERE course_id=$1`,
              [session.course_id]
            );
             if (instRes.rowCount === 0) {
                throw new Error("No available instructor for this section");
              }

            const instructorId = instRes.rows[0].instructor_id;
            //  Max instructor load/day
            const loadRes = await client.query(
              `SELECT COUNT(*) as count
               FROM day_courses dc
               JOIN day_schedules ds ON dc.day_schedule_id=ds.id
               JOIN schedules s ON ds.schedule_id=s.id
               WHERE dc.instructor_id=$1
                 AND ds.day_of_week=$2
                 AND s.status='published'`,
              [instructorId, dayName]
            );
            if (loadRes.rows[0].count >= MAX_INSTRUCTOR_LOAD) continue;

            //  Global instructor conflict
          const globalConflict = await client.query(
              `SELECT 1
               FROM day_courses dc
               JOIN day_schedules ds ON dc.day_schedule_id=ds.id
               JOIN schedules s ON ds.schedule_id=s.id
               WHERE dc.instructor_id=$1
                 AND ds.day_of_week=$2
                 AND dc.start_time=$3
                 AND dc.end_time=$4
                 AND s.status='published'
               LIMIT 1`,
              [instructorId, dayName, slot.start_time, slot.end_time]
            );
            if (globalConflict.rowCount > 0) continue;

            // Local conflict
            const localConflict = assignments.find(a =>
              a.day === dayName &&
              a.start === slot.start_time &&
              (a.room === room.room_id || a.instructor === instructorId)
            );
            if (localConflict) continue;
            console.log('hour start on ',++k,'-i', slot.start_time ,'-', slot.end_time, '-', slot.slot_type, '-day:',dayScheduleId)
            // INSERT
            await client.query(
              `INSERT INTO day_courses
               (day_schedule_id, course_id, room_id, instructor_id, start_time, end_time,session_type)
               VALUES ($1,$2,$3,$4,$5,$6,$7)`,
              [
                dayScheduleId,
                session.course_id,
                room.room_id,
                instructorId,
                slot.start_time,
                slot.end_time,
                session.type
              ]
            );

            assignments.push({
              dayScheduleId:dayScheduleId,
              course_id: session.course_id,
              type: session.type,
              day: dayName,
              start: slot.start_time,
              end: slot.end_time,
              room: room.room_id,
              instructor: instructorId
            });
            courseDayUsage[dayScheduleId].add(session.course_id);
            placed = true;
            break;
          }
          if (placed) break;
        }
        if (placed) break;
      }

      if (!placed) {
        conflictReport.push({
          course_id: session.course_id,
          session_type: session.type,
          reason: "No available slot / instructor / room"
        });
      }
    }
    console.log('All coures and schedule ', assignments);
    await client.query("COMMIT");

    return res.json({
      success: conflictReport.length === 0,
      schedule_id: scheduleId,
      total_sessions: assignments.length,
      conflicts: conflictReport
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};
function generateTimeSlots(timslot) {
  const slots = [];

  const BREAK_START = "6:30";
  const BREAK_END = "7:30";

  for (const row of timslot.rows) {
    let currentTime = row.start_time;

    while (timeLessThan(addHours(currentTime, 0), row.end_time)) {

      // ⏸ Skip break
      if (currentTime >= BREAK_START && currentTime < BREAK_END) {
        currentTime = BREAK_END;
        continue;
      }

      /* ---------- LECTURE ---------- */
      const lecEnd = addHours(currentTime, row.lecture_duration);
      if (
        timeLessThan(lecEnd, row.end_time) &&
        (lecEnd <= BREAK_START || currentTime >= BREAK_END) &&
        isWithinRange(currentTime, lecEnd, LECTURE_WINDOW.start, LECTURE_WINDOW.end)
      ) {
        slots.push({
          start_time: currentTime,
          end_time: lecEnd,
          slot_type: "LEC"
        });
      }

      /* ---------- LAB ---------- */
      if (row.labratory_duration > 0) {
        const labEnd = addHours(currentTime, row.labratory_duration);

        if (
          timeLessThan(labEnd, row.end_time) &&
          (labEnd <= BREAK_START || currentTime >= BREAK_END) &&
          isWithinRange(currentTime, labEnd, LAB_WINDOW.start, LAB_WINDOW.end)
        ) {
          slots.push({
            start_time: currentTime,
            end_time: labEnd,
            slot_type: "LAB"
          });
        }
      }

      currentTime = addHours(currentTime, 1); // step forward
    }
  }

  return slots;
}

function calculateCourseSessions(course, timslot) {
  const sessions = [];
  let lecSlots, labSlots;
  for (const row of timslot.rows) {
    lecSlots = Math.ceil((course.lec_hr + course.tut_hr) / row.lecture_duration);
    labSlots = Math.ceil(course.lab_hr / row.labratory_duration);
  
    for (let i = 0; i < lecSlots; i++) {
      sessions.push({ course_id: course.course_id, type: "LEC", totallec_hr:row.lecture_duration + row.lecture_duration});
    }
    for (let i = 0; i < labSlots; i++) {
      sessions.push({ course_id: course.course_id, type: "LAB" , totallab_hr:row.labratory_duration+row.labratory_duration});
    }
  }

  return sessions;
}
function addHours(time, hours) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 1, 1, h, m);
  d.setHours(d.getHours() + hours);
  return d.toTimeString().slice(0, 5);
}
function diffHours(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh + em / 60) - (sh + sm / 60);
}
function timeLessThan(t1, t2) {
  return t1 <= t2;
}

export default autoGenerateSchedule;