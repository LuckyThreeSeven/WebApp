CREATE DATABASE IF NOT EXISTS testdb;
USE testdb;

CREATE TABLE blackboxes (
    uuid CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    health_status VARCHAR(20) NOT NULL DEFAULT 'HEALTHY',
    last_connected_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE video_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    blackbox_uuid CHAR(36) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    duration FLOAT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    stream_started_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO video_metadata (blackbox_uuid, file_path, file_size, duration, file_type, stream_started_at, created_at) VALUES ('1000', 'blackbox-videos/testvideo.mp4', 1024, 60, 'video/mp4', '2025-09-19 00:00:00', '2025-09-19 00:00:00');
