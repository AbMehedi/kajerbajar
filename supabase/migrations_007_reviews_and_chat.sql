-- migrations_007_reviews_and_chat.sql
-- Phase 5 & 6: Feedback and Real-time Messaging
-- ═══════════════════════════════════════════════════════════════════
-- 1. Project Reviews Table
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS project_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users_profiles(id),
    reviewee_id UUID NOT NULL REFERENCES users_profiles(id),
    rating INT NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, reviewer_id)
);
-- ═══════════════════════════════════════════════════════════════════
-- 2. Chat Messages Table
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users_profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ═══════════════════════════════════════════════════════════════════
-- 3. Security (RLS)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE project_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
-- ── Chat Policies ──
DROP POLICY IF EXISTS "Participants can view chat messages" ON chat_messages;
CREATE POLICY "Participants can view chat messages" ON chat_messages FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM projects p
            WHERE p.id = project_id
                AND (
                    p.company_id = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM applications a
                        WHERE a.project_id = p.id
                            AND a.student_id = auth.uid()
                            AND a.status = 'selected'
                    )
                )
        )
    );
DROP POLICY IF EXISTS "Participants can send chat messages" ON chat_messages;
CREATE POLICY "Participants can send chat messages" ON chat_messages FOR
INSERT WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM projects p
            WHERE p.id = project_id
                AND (
                    p.company_id = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM applications a
                        WHERE a.project_id = p.id
                            AND a.student_id = auth.uid()
                            AND a.status = 'selected'
                    )
                )
        )
    );
-- ── Review Policies ──
DROP POLICY IF EXISTS "Reviews are public for profiles" ON project_reviews;
CREATE POLICY "Reviews are public for profiles" ON project_reviews FOR
SELECT USING (true);
DROP POLICY IF EXISTS "Participants can leave reviews for completed projects" ON project_reviews;
CREATE POLICY "Participants can leave reviews for completed projects" ON project_reviews FOR
INSERT WITH CHECK (
        reviewer_id = auth.uid()
        AND EXISTS (
            SELECT 1
            FROM projects p
            WHERE p.id = project_id
                AND p.status = 'completed'
                AND (
                    p.company_id = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM applications a
                        WHERE a.project_id = p.id
                            AND a.student_id = auth.uid()
                            AND a.status = 'selected'
                    )
                )
        )
    );