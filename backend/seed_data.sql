-- =====================================================================
-- DoubtAI — Seed data
-- Mirrors the demo data currently hardcoded in the React UI, so the
-- app looks identical once it's reading from this database.
-- Run AFTER schema.sql
-- =====================================================================

USE doubtai_db;

-- ---------------------------------------------------------------------
-- USERS
-- ---------------------------------------------------------------------
-- NOTE: password_hash below is a placeholder. Never store plain-text
-- passwords — hash them (e.g. bcrypt) in your FastAPI signup endpoint.
INSERT INTO users (full_name, email, password_hash, preferred_subjects, role) VALUES
  ('Sumedha', 'sumedha@college.edu', '$2b$12$replace_with_real_bcrypt_hash', 'Java, Data Structures, DBMS', 'student'),
  ('Admin User', 'admin@doubtai.app', '$2b$12$replace_with_real_bcrypt_hash', NULL, 'admin');

-- ---------------------------------------------------------------------
-- DOUBTS  (matches MY_DOUBTS in the UI)
-- ---------------------------------------------------------------------
INSERT INTO doubts (user_id, question, domain, subject, topic, difficulty, confidence_score, status, created_at) VALUES
  (1, 'What is the difference between an abstract class and an interface in Java?', 'Computer Science & IT', 'Java / OOP', 'Abstraction', 'Medium', 92, 'Solved', '2026-08-20 10:00:00'),
  (1, 'How do generics improve type safety in Java collections?', 'Computer Science & IT', 'Java / OOP', 'Generics', 'Medium', 88, 'Solved', '2026-08-18 09:30:00'),
  (1, 'Why does my BST insertion function throw a StackOverflowError?', 'Computer Science & IT', 'Data Structures', 'BST', 'Hard', 74, 'In Progress', '2026-08-15 15:20:00'),
  (1, 'What''s the difference between composition and inheritance?', 'Computer Science & IT', 'Java / OOP', 'Inheritance', 'Easy', 95, 'Unanswered', '2026-08-10 11:45:00');

-- ---------------------------------------------------------------------
-- SIMILAR QUESTIONS  (matches SIMILAR_QUESTIONS in the UI)
-- ---------------------------------------------------------------------
INSERT INTO similar_questions (doubt_id, related_question, similarity_score) VALUES
  (3, 'How does a self-balancing BST differ from a regular BST?', 91),
  (3, 'What is the time complexity of BST insertion in the worst case?', 86),
  (3, 'Explain in-order traversal of a Binary Search Tree.', 78);

-- ---------------------------------------------------------------------
-- RESOURCES  (matches RESOURCES in the UI)
-- ---------------------------------------------------------------------
INSERT INTO resources (title, subject, topic, difficulty, resource_type, relevance_score) VALUES
  ('Binary Search Trees Explained Visually', 'Data Structures', 'BST', 'Medium', 'Video', 96),
  ('BST Operations — Lecture Notes', 'Data Structures', 'BST', 'Medium', 'Notes', 92),
  ('Practice Set: BST Insertions & Deletions', 'Data Structures', 'BST', 'Hard', 'Practice Questions', 89),
  ('Tree Data Structures — Official Docs', 'Data Structures', 'Trees', 'Easy', 'Documentation', 84),
  ('Understanding Tree Balancing', 'Data Structures', 'AVL Trees', 'Hard', 'Article', 80),
  ('BST Cheat Sheet (PDF)', 'Data Structures', 'BST', 'Easy', 'PDF', 77);

-- Link the BST-related resources to the matching doubt
INSERT INTO doubt_resources (doubt_id, resource_id, relevance_score)
SELECT 3, id, relevance_score FROM resources WHERE topic IN ('BST', 'Trees', 'AVL Trees');

-- ---------------------------------------------------------------------
-- QUIZ  (matches QUIZ_QUESTIONS in the UI)
-- ---------------------------------------------------------------------
INSERT INTO quizzes (doubt_id, user_id, subject, topic, difficulty) VALUES
  (3, 1, 'Data Structures & Java / OOP', 'BST & Inheritance', 'Medium');

INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option) VALUES
  (1, 'What is the average time complexity of a search operation in a balanced Binary Search Tree?', 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'B'),
  (1, 'Which traversal of a BST visits nodes in ascending sorted order?', 'Pre-order', 'Post-order', 'In-order', 'Level-order', 'C'),
  (1, 'In Java, which keyword is used to inherit a class?', 'implements', 'extends', 'inherits', 'instanceof', 'B'),
  (1, 'Which of these is NOT a feature of an interface prior to Java 8?', 'Abstract methods', 'Constants', 'Method bodies', 'Multiple inheritance of type', 'C');

-- ---------------------------------------------------------------------
-- STUDY PLANNER  (matches PLANNER_TASKS in the UI)
-- ---------------------------------------------------------------------
INSERT INTO study_plans (user_id, task, subject, due_date, priority, is_completed) VALUES
  (1, 'Revise Binary Search Trees', 'Data Structures', CURDATE(), 'High', FALSE),
  (1, 'Solve 10 practice problems on Generics', 'Java / OOP', CURDATE(), 'Medium', FALSE),
  (1, 'Read Chapter 4 — Normalization', 'DBMS', CURDATE() + INTERVAL 1 DAY, 'Medium', FALSE),
  (1, 'Attempt mock quiz on Inheritance', 'Java / OOP', CURDATE() - INTERVAL 2 DAY, 'Low', TRUE);

-- ---------------------------------------------------------------------
-- PROGRESS TRACKING  (matches LINE_DATA in the UI)
-- ---------------------------------------------------------------------
INSERT INTO progress_tracking (user_id, week_label, progress_percentage) VALUES
  (1, 'W1', 10), (1, 'W2', 22), (1, 'W3', 31),
  (1, 'W4', 40), (1, 'W5', 52), (1, 'W6', 68);
