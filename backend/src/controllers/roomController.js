const pool = require("../db");
// CREATE Room (now directly connected to block)
const createRoom = async (req, res) => {
  const { 
    block_id, 
    room_number, 
    room_name, 
    room_type, 
    capacity, 
    facilities, 
    is_available 
  } = req.body;

  if (!block_id || !room_number || !room_type) {
    return res.status(400).json({ error: "Block ID, room number, and room type are required" });
  }

  try {
    const insertResult = await pool.query(
      `INSERT INTO rooms (block_id, room_number, room_name, room_type, capacity, facilities, is_available) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [block_id, room_number, room_name, room_type, capacity, facilities || [], is_available !== false]
    );
   if (err.code === "23505") {
      return res.status(409).json({ error: "Room already exists in this block" });
    }
     if (err.code === "23503") {
      return res.status(404).json({ error: "Block not found" });
    }
    res.status(201).json(insertResult.rows[0]);
  } catch (err) {
    console.error("Room creation error:", err);

    if (err.code === "23505") {
      return res.status(409).json({ error: "Room already exists in this block" });
    }

    if (err.code === "23503") {
      return res.status(404).json({ error: "Block not found" });
    }

    res.status(500).json({ error: "Server error" });
  }
};
// READ All Rooms with Block Info
const getRooms = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        r.*, 
        b.block_name,
        b.block_code,
        b.description as block_description
       FROM rooms r
       JOIN blocks b ON r.block_id = b.block_id
       ORDER BY b.block_name, r.room_number`
    );
    console.log("Rooms fetched:", rows.length); // Debug log
    res.status(200).json(rows);
  } catch (err) {
    console.error("Rooms fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// READ All Rooms with Block Info
const getRoomsForDep = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT 
        r.*, 
        b.block_name,
        b.block_code,
        b.description as block_description
       FROM rooms r
       JOIN blocks b ON r.block_id = b.block_id
       ORDER BY b.block_name, r.room_number`
    );
    console.log("Rooms fetched:", rows.length); // Debug log
    res.status(200).json(rows);
  } catch (err) {
    console.error("Rooms fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// READ Room by ID
const getRoomById = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT 
        r.*, 
        b.block_name,
        b.block_code,
        b.description as block_description
       FROM rooms r
       JOIN blocks b ON r.block_id = b.block_id
       WHERE r.room_id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error("Room fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// READ Rooms by Block ID
const getRoomsByBlock = async (req, res) => {
  const { blockId } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT 
        r.*, 
        b.block_name,
        b.block_code
       FROM rooms r
       JOIN blocks b ON r.block_id = b.block_id
       WHERE r.block_id = $1
       ORDER BY r.room_number`,
      [blockId]
    );

    res.status(200).json(rows);
  } catch (err) {
    console.error("Rooms by block fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// UPDATE Room
const updateRoom = async (req, res) => {
  const { id } = req.params;
  const {
    block_id,
    room_number,
    room_name,
    room_type,
    capacity,
    facilities,
    is_available
  } = req.body;

  try {
    const updateResult = await pool.query(
      `UPDATE rooms 
       SET block_id = $1, room_number = $2, room_name = $3, room_type = $4, 
           capacity = $5, facilities = $6, is_available = $7
       WHERE room_id = $8 
       RETURNING *`,
      [block_id, room_number, room_name, room_type, capacity, facilities, is_available, id]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error("Room update error:", err);
    
    if (err.code === "23505") {
      return res.status(409).json({ error: "Room already exists in this block" });
    }

    res.status(500).json({ error: "Server error" });
  }
};
// DELETE Room
const deleteRoom = async (req, res) => {
  const { id } = req.params;

  try {
    const deleteResult = await pool.query(
      "DELETE FROM rooms WHERE room_id = $1",
      [id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error("Room deletion error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// Search rooms with filters
const searchRooms = async (req, res) => {
  try {
    const { 
      block_id, 
      room_type, 
      min_capacity, 
      is_available,
      search 
    } = req.query;

    let query = `
      SELECT 
        r.*, 
        b.block_name,
        b.block_code
      FROM rooms r
      JOIN blocks b ON r.block_id = b.block_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (block_id) {
      query += ` AND r.block_id = $${paramCount}`;
      params.push(block_id);
      paramCount++;
    }

    if (room_type) {
      query += ` AND r.room_type = $${paramCount}`;
      params.push(room_type);
      paramCount++;
    }

    if (min_capacity) {
      query += ` AND r.capacity >= $${paramCount}`;
      params.push(parseInt(min_capacity));
      paramCount++;
    }

    if (is_available !== undefined) {
      query += ` AND r.is_available = $${paramCount}`;
      params.push(is_available === 'true');
      paramCount++;
    }

    if (search) {
      query += ` AND (
        r.room_number ILIKE $${paramCount} OR 
        r.room_name ILIKE $${paramCount} OR 
        b.block_name ILIKE $${paramCount} OR 
        b.block_code ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY b.block_name, r.room_number`;

    const { rows } = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Room search error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
// Get available rooms (for scheduling)
const getAvailableRooms = async (req, res) => {
  try {
    const { 
      date, 
      start_time, 
      end_time,
      block_id,
      room_type,
      min_capacity
    } = req.query;

    let query = `
      SELECT 
        r.*, 
        b.block_name,
        b.block_code,
        CONCAT(b.block_code, ' - Room ', r.room_number) as location
      FROM rooms r
      JOIN blocks b ON r.block_id = b.block_id
      WHERE r.is_available = true
    `;
    
    const params = [];
    let paramCount = 1;

    if (date && start_time && end_time) {
      query += ` AND r.room_id NOT IN (
        SELECT dc.room_id 
        FROM day_courses dc
        JOIN day_schedules ds ON dc.day_schedule_id = ds.id
        WHERE ds.day_of_week = $${paramCount} 
          AND NOT (dc.end_time <= $${paramCount + 1} OR dc.start_time >= $${paramCount + 2})
      )`;
      params.push(date, start_time, end_time);
      paramCount += 3;
    }

    if (block_id) {
      query += ` AND r.block_id = $${paramCount}`;
      params.push(block_id);
      paramCount++;
    }

    if (room_type) {
      query += ` AND r.room_type = $${paramCount}`;
      params.push(room_type);
      paramCount++;
    }

    if (min_capacity) {
      query += ` AND r.capacity >= $${paramCount}`;
      params.push(parseInt(min_capacity));
      paramCount++;
    }

    query += ` ORDER BY b.block_name, r.room_number`;

    const { rows } = await pool.query(query, params);
    res.status(200).json(rows);
  } catch (err) {
    console.error("Available rooms fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  getRoomsByBlock,  // Changed from getRoomsByFloor
  updateRoom,
  deleteRoom,
  searchRooms,
  getAvailableRooms
};