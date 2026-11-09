-- =====================================================================
-- DoubtAI v2 migration — run this ONLY if you already created doubtai_db
-- with the old schema.sql. (Fresh installs: just run schema.sql.)
--
--   mysql -u root -p doubtai_db < migration_v2.sql
-- =====================================================================

ALTER TABLE doubts
  ADD COLUMN domain VARCHAR(120) AFTER question,
  ADD COLUMN bloom_level TINYINT UNSIGNED AFTER simplified_explanation,
  ADD COLUMN algorithm_insights TEXT AFTER bloom_level,
  ADD INDEX idx_doubts_domain (domain);

ALTER TABLE similar_questions
  ADD COLUMN source ENUM('history', 'ai') NOT NULL DEFAULT 'ai' AFTER similarity_score;

-- Give the demo doubts a domain so the classifier can learn from them
UPDATE doubts SET domain = 'Computer Science & IT'
WHERE domain IS NULL AND subject IN ('Java / OOP', 'Data Structures', 'DBMS', 'Operating Systems');
