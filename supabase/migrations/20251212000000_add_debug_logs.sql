CREATE TABLE IF NOT EXISTS debug_logs (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT,
    message TEXT,
    data JSONB
);

ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert for debugging" ON debug_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select for debugging" ON debug_logs FOR SELECT USING (true);
