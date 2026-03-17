-- Add answers column to assessment_submissions to store question responses
ALTER TABLE assessment_submissions
  ADD COLUMN IF NOT EXISTS answers JSONB NULL;

-- answers format:
-- { "question_id": "text answer" }          -- for open_ended questions
-- { "question_id": 2 }                       -- for mcq questions (selected option index)
