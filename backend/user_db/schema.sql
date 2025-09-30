-- ----------------------------
-- "blackbox" 테이블 스키마 (PostgreSQL 용)
-- ----------------------------
CREATE TABLE
    IF NOT EXISTS blackbox (
                               "uuid" VARCHAR(255) NOT NULL,
                               "nickname" VARCHAR(255) NULL,
                               "user_id" VARCHAR(255) NULL,
                               "created_at" TIMESTAMP(6) NULL,
                               PRIMARY KEY ("uuid")
);

COMMENT ON TABLE blackbox IS '블랙박스 장치 정보를 저장하는 테이블';
COMMENT ON COLUMN blackbox.uuid IS '블랙박스 고유 UUID';
COMMENT ON COLUMN blackbox.nickname IS '블랙박스 별칭';
COMMENT ON COLUMN blackbox.user_id IS '사용자 ID';
COMMENT ON COLUMN blackbox.created_at IS '생성 시간';


-- ----------------------------
-- "metadata" 테이블 스키마 (PostgreSQL 용)
-- ----------------------------
CREATE TABLE
    IF NOT EXISTS metadata (
                               "id" VARCHAR(255) NOT NULL,
                               "blackbox_uuid" VARCHAR(255) NULL,
                               "stream_started_at" TIMESTAMP(6) NULL,
                               "created_at" TIMESTAMP(6) NULL,
                               "file_size" BIGINT NULL,
                               "duration" BIGINT NULL,
                               "object_key" VARCHAR(255) NULL,
                               "file_type" VARCHAR(255) NULL,
                               "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE,
                               PRIMARY KEY ("id"),
                               CONSTRAINT "fk_metadata_to_blackbox" FOREIGN KEY ("blackbox_uuid") REFERENCES "blackbox" ("uuid") ON DELETE SET NULL ON UPDATE CASCADE
);

-- blackbox_uuid 컬럼에 대한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_blackbox_uuid ON metadata (blackbox_uuid);

COMMENT ON TABLE metadata IS '영상 메타데이터를 저장하는 테이블';
COMMENT ON COLUMN metadata.id IS '메타데이터 고유 ID';
COMMENT ON COLUMN metadata.blackbox_uuid IS '참조하는 블랙박스의 UUID';
COMMENT ON COLUMN metadata.stream_started_at IS '영상이 연속적으로 들어오기 시작한 시간';
COMMENT ON COLUMN metadata.created_at IS '메타데이터 생성 시간';
COMMENT ON COLUMN metadata.file_size IS '파일 크기 (bytes)';
COMMENT ON COLUMN metadata.duration IS '영상 길이 (seconds)';
COMMENT ON COLUMN metadata.object_key IS '스토리지의 객체 키';
COMMENT ON COLUMN metadata.file_type IS '파일 타입 (e.g., mp4)';
COMMENT ON COLUMN metadata.is_deleted IS '삭제 여부 (false: 유지, true: 삭제)';