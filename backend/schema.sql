-- =====================================================================
-- DoubtAI — AI Doubt Classification and Resource Recommender
-- Database schema (MySQL 8.0+)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS doubtai_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE doubtai_db;

-- ---------------------------------------------------------------------
-- 1. USERS  (User Authentication Module)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  full_name          VARCHAR(150) NOT NULL,
  email              VARCHAR(150) NOT NULL UNIQUE,
  password_hash      VARCHAR(255) NOT NULL,
  preferred_subjects VARCHAR(255),
  role               ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. DOUBTS  (Doubt Submission + AI Classification + Explanation Modules)
-- ---------------------------------------------------------------------
CREATE TABLE doubts (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  user_id                 INT NOT NULL,
  question                TEXT NOT NULL,
  domain                  VARCHAR(120),              -- broad area (Naive Bayes + LLM ensemble)
  subject                 VARCHAR(120),
  topic                   VARCHAR(150),
  difficulty              ENUM('Easy', 'Medium', 'Hard'),
  confidence_score        TINYINT UNSIGNED,          -- 0-100
  explanation             TEXT,
  simplified_explanation  TEXT,
  bloom_level             TINYINT UNSIGNED,          -- 1-6 (Bloom's taxonomy)
  algorithm_insights      TEXT,                      -- JSON breakdown of every algorithm's output
  status                  ENUM('Solved', 'In Progress', 'Unanswered') NOT NULL DEFAULT 'Unanswered',
  source                  ENUM('text', 'voice', 'image') NOT NULL DEFAULT 'text',
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_doubts_user (user_id),
  INDEX idx_doubts_subject_topic (subject, topic),
  INDEX idx_doubts_domain (domain)
);

-- ---------------------------------------------------------------------
-- 3. SIMILAR QUESTIONS  (Similar Question Retrieval Module)
-- ---------------------------------------------------------------------
CREATE TABLE similar_questions (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  doubt_id          INT NOT NULL,
  related_question  TEXT NOT NULL,
  similarity_score  TINYINT UNSIGNED NOT NULL,        -- 0-100
  source            ENUM('history', 'ai') NOT NULL DEFAULT 'ai',  -- past doubt (TF-IDF) or AI-suggested
  FOREIGN KEY (doubt_id) REFERENCES doubts(id) ON DELETE CASCADE,
  INDEX idx_similar_doubt (doubt_id)
);

-- ---------------------------------------------------------------------
-- 4. RESOURCES  (Resource Recommendation Module)
-- ---------------------------------------------------------------------
CREATE TABLE resources (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  subject          VARCHAR(120),
  topic            VARCHAR(150),
  difficulty       ENUM('Easy', 'Medium', 'Hard'),
  resource_type    ENUM('Video', 'PDF', 'Article', 'Notes', 'Practice Questions', 'Documentation') NOT NULL,
  url              VARCHAR(500),
  relevance_score  TINYINT UNSIGNED,                  -- 0-100
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_resources_subject_topic (subject, topic),
  INDEX idx_resources_type (resource_type)
);

-- Maps recommended resources to the doubt that generated the recommendation
CREATE TABLE doubt_resources (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  doubt_id         INT NOT NULL,
  resource_id      INT NOT NULL,
  relevance_score  TINYINT UNSIGNED,
  FOREIGN KEY (doubt_id) REFERENCES doubts(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_doubt_resource (doubt_id, resource_id)
);

CREATE TABLE resource_bookmarks (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  resource_id  INT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_resource (user_id, resource_id)
);

-- ---------------------------------------------------------------------
-- 5. QUIZZES  (Quiz Module)
-- ---------------------------------------------------------------------
CREATE TABLE quizzes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  doubt_id    INT,                                    -- nullable: quiz can stand alone
  user_id     INT NOT NULL,
  subject     VARCHAR(120),
  topic       VARCHAR(150),
  difficulty  ENUM('Easy', 'Medium', 'Hard'),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doubt_id) REFERENCES doubts(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE quiz_questions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id         INT NOT NULL,
  question        TEXT NOT NULL,
  option_a        VARCHAR(255) NOT NULL,
  option_b        VARCHAR(255) NOT NULL,
  option_c        VARCHAR(255) NOT NULL,
  option_d        VARCHAR(255) NOT NULL,
  correct_option  ENUM('A', 'B', 'C', 'D') NOT NULL,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE TABLE quiz_attempts (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  quiz_id          INT NOT NULL,
  user_id          INT NOT NULL,
  score            SMALLINT UNSIGNED NOT NULL,
  total_questions  SMALLINT UNSIGNED NOT NULL,
  percentage       DECIMAL(5,2) NOT NULL,
  attempted_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE quiz_answers (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id        INT NOT NULL,
  question_id       INT NOT NULL,
  selected_option   ENUM('A', 'B', 'C', 'D'),
  is_correct        BOOLEAN NOT NULL,
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 6. STUDY PLANNER  (Study Planner Module)
-- ---------------------------------------------------------------------
CREATE TABLE study_plans (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  task          VARCHAR(255) NOT NULL,
  subject       VARCHAR(120),
  topic         VARCHAR(150),
  due_date      DATE,
  priority      ENUM('High', 'Medium', 'Low') NOT NULL DEFAULT 'Medium',
  is_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_plans_user (user_id)
);

-- ---------------------------------------------------------------------
-- 7. PROGRESS TRACKING  (Progress Dashboard Module)
-- ---------------------------------------------------------------------
CREATE TABLE progress_tracking (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  user_id              INT NOT NULL,
  week_label           VARCHAR(20) NOT NULL,           -- e.g. 'W1', 'W2'
  progress_percentage  TINYINT UNSIGNED NOT NULL,
  recorded_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 8. FEEDBACK  (Feedback Module)
-- ---------------------------------------------------------------------
CREATE TABLE feedback (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  doubt_id         INT,
  resource_id      INT,
  ai_rating        TINYINT UNSIGNED,                   -- 1-5
  resource_rating  TINYINT UNSIGNED,                   -- 1-5
  comments         TEXT,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (doubt_id) REFERENCES doubts(id) ON DELETE SET NULL,
  FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- 9. ADMIN ACTIVITY LOG  (Admin Dashboard Module)
-- ---------------------------------------------------------------------
CREATE TABLE admin_logs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  admin_id     INT NOT NULL,
  action       VARCHAR(255) NOT NULL,
  target_type  VARCHAR(50),                            -- 'user' | 'resource' | 'doubt' | ...
  target_id    INT,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);
