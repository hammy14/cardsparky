CREATE DATABASE IF NOT EXISTS ProjectTracker;
USE ProjectTracker;

CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('Active','On Hold','Completed','Cancelled') DEFAULT 'Active',
  shirt_size ENUM('XS','S','M','L','XL') DEFAULT 'XS',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS releases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  version VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  release_date DATE,
  status ENUM('Planning','In Progress','Released') DEFAULT 'Planning',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  release_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('Enhancement','Bug','Change Request') DEFAULT 'Enhancement',
  status ENUM('Backlog','In Progress','In Review','Done') DEFAULT 'Backlog',
  priority ENUM('Low','Medium','High','Critical') DEFAULT 'Medium',
  shirt_size ENUM('XS','S','M','L','XL') DEFAULT 'S',
  assignee VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE SET NULL
);
