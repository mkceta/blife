-- Fix Poll Vote Counting with Atomic Triggers
-- This replaces the manual client-side counter updates with proper database triggers
-- Prevents race conditions and ensures vote counts are always accurate

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS on_poll_vote_insert ON poll_votes;
DROP TRIGGER IF EXISTS on_poll_vote_delete ON poll_votes;
DROP FUNCTION IF EXISTS increment_poll_votes();
DROP FUNCTION IF EXISTS decrement_poll_votes();

-- Function to increment vote counts atomically
CREATE OR REPLACE FUNCTION increment_poll_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment the specific option's vote count
  UPDATE poll_options
  SET vote_count = vote_count + 1
  WHERE id = NEW.option_id;
  
  -- Increment the poll's total votes
  UPDATE polls
  SET total_votes = total_votes + 1
  WHERE id = NEW.poll_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement vote counts atomically (for vote removal)
CREATE OR REPLACE FUNCTION decrement_poll_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement the specific option's vote count
  UPDATE poll_options
  SET vote_count = GREATEST(vote_count - 1, 0)
  WHERE id = OLD.option_id;
  
  -- Decrement the poll's total votes
  UPDATE polls
  SET total_votes = GREATEST(total_votes - 1, 0)
  WHERE id = OLD.poll_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT (new vote)
CREATE TRIGGER on_poll_vote_insert
  AFTER INSERT ON poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION increment_poll_votes();

-- Create trigger for DELETE (vote removal)
CREATE TRIGGER on_poll_vote_delete
  AFTER DELETE ON poll_votes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_poll_votes();

-- Recalculate all existing vote counts to fix any inconsistencies
-- This ensures we start with accurate data
UPDATE poll_options po
SET vote_count = (
  SELECT COUNT(*)
  FROM poll_votes pv
  WHERE pv.option_id = po.id
);

UPDATE polls p
SET total_votes = (
  SELECT COUNT(*)
  FROM poll_votes pv
  WHERE pv.poll_id = p.id
);

-- Add comment for documentation
COMMENT ON FUNCTION increment_poll_votes() IS 'Atomically increments vote counts when a new vote is cast';
COMMENT ON FUNCTION decrement_poll_votes() IS 'Atomically decrements vote counts when a vote is removed';
