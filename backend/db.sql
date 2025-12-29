-- Create database
CREATE DATABASE schedule_db;

-- Switch to database
use schedule_db;

CREATE TABLE faculity(
    faculity_id SERIAL PRIMARY KEY,
    faculity_name VARCHAR(255) NOT NULL ,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) UNIQUE NOT NULL,
    head_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    faculity_id int ,
   FOREIGN KEY (faculity_id) REFERENCES faculity(faculity_id)

);

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('instructor', 'department_head', 'admin')) NOT NULL,
    id_number VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL,
    is_first_login BOOLEAN DEFAULT TRUE,
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatd_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);
INSERT INTO users (full_name,email,password_hash,role,id_number,username,status) values (
    'admin','Admin@gmail.com','$2b$10$UlCvZVBkvwbPAArbx5CYdOnVNmVO0SZ2GFMwvCdDe51qLjvJMsUD6','admin','A0002','Admin','Active'
);
-- Create departments_history table
CREATE TABLE departments_history (
    department_id INT NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    head_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lastdate_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create course table
CREATE TABLE Course (
    course_id SERIAL PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    credit_hour INT NOT NULL,
    category VARCHAR(50) NOT NULL
);

CREATE TABLE blocks (
    block_id SERIAL PRIMARY KEY,
    block_name VARCHAR(50) NOT NULL UNIQUE,
    block_code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample blocks
INSERT INTO blocks (block_name, block_code, description) VALUES
('Main Block', 'MB', 'Main academic building'),
('Science Block', 'SB', 'Science and laboratory building'),
('Engineering Block', 'EB', 'Engineering and technology building'),
('Arts Block', 'AB', 'Arts and humanities building');
-- create bloack table 
CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,
    room_name VARCHAR(100),
    room_type VARCHAR(50) NOT NULL, -- 'classroom', 'lab', 'office', 'conference', 'library'
    capacity INTEGER,
    facilities TEXT[], -- Array of facilities: {'projector', 'ac', 'computers', 'whiteboard'}
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE( room_number)
);

-- Insert sample rooms
INSERT INTO rooms ( room_number, room_name, room_type, capacity, facilities) VALUES
( 'G01', 'Main Hall', 'conference', 200, '{"projector", "ac", "sound_system"}'),
( 'G02', 'Reception', 'office', 5, '{"ac", "computers"}'),
( '101', 'Classroom 101', 'classroom', 40, '{"projector", "whiteboard"}'),
( '102', 'Computer Lab', 'lab', 30, '{"computers", "projector", "ac"}'),
( '201', 'Physics Lab', 'lab', 25, '{"lab_equipment", "projector"}'),
( 'B01', 'Chemistry Lab A', 'lab', 20, '{"lab_equipment", "fume_hood"}');


-- Create batches table
CREATE TABLE batches (
    batch_id SERIAL PRIMARY KEY,
    batch_year VARCHAR(20) NOT NULL,   -- Example: 2016, 2017, 2024
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
-- Create semesters table
CREATE TABLE semesters (
    id SERIAL PRIMARY KEY,
    batch_id int NOT NULL,
    semester VARCHAR(20) NOT NULL,
    academic_year VARCHAR(9) NOT NULL, -- Format: 2023-2024
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    department_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Foreign key constraint
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    -- Unique constraint to prevent duplicate semesters in same department
    UNIQUE(semester, academic_year, department_id)
);

-- Update schedules table to use batch_id and semester_id
CREATE TABLE schedules (
    id SERIAL PRIMARY KEY,
    department_id INT,
    batch_id INT,
    semester_id INT,
    section VARCHAR(10) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('draft','published')) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE SET NULL,
    UNIQUE (batch_id, semester_id, section, department_id) -- Prevent duplicate schedules
);



-- Create day_schedules table
CREATE TABLE day_schedules (
    id SERIAL PRIMARY KEY,
    schedule_id INT NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
);

-- Create day_courses table
CREATE TABLE day_courses (
    id SERIAL PRIMARY KEY,
    day_schedule_id INT NOT NULL,
    course_id INT NOT NULL,
    room_id INT NOT NULL,
    instructor_id INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    color VARCHAR(7) DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (day_schedule_id) REFERENCES day_schedules(id) ON DELETE CASCADE
);

-- Enhanced feedback table schema
CREATE TABLE feedback (
  id SERIAL PRIMARY KEY,
  id_number VARCHAR(50) NOT NULL,
  mes_category VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    department_id INTEGER REFERENCES departments(id),
    priority VARCHAR(20) DEFAULT 'normal',
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    publish_at TIMESTAMP,
    expires_at TIMESTAMP
);