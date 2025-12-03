-- Function to update seller rating when a review is created/updated/deleted
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate new average and count for the seller
    UPDATE public.users
    SET 
        rating_avg = (
            SELECT ROUND(AVG(stars)::numeric, 1)
            FROM public.reviews
            WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id)
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id)
        )
    WHERE id = COALESCE(NEW.seller_id, OLD.seller_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS review_rating_update ON public.reviews;

-- Create trigger that fires after INSERT, UPDATE, or DELETE on reviews
CREATE TRIGGER review_rating_update
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_seller_rating();

-- Recalculate all existing ratings
DO $$
DECLARE
    seller_record RECORD;
BEGIN
    FOR seller_record IN 
        SELECT DISTINCT seller_id FROM public.reviews
    LOOP
        UPDATE public.users
        SET 
            rating_avg = (
                SELECT ROUND(AVG(stars)::numeric, 1)
                FROM public.reviews
                WHERE seller_id = seller_record.seller_id
            ),
            rating_count = (
                SELECT COUNT(*)
                FROM public.reviews
                WHERE seller_id = seller_record.seller_id
            )
        WHERE id = seller_record.seller_id;
    END LOOP;
END $$;
