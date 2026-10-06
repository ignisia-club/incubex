-- Migration 02: Insert Dummy Teams for Testing

INSERT INTO teams (team_id) VALUES
('INC-12345'),
('INC-56789'),
('INC-99999')
ON CONFLICT (team_id) DO NOTHING;
