-- Add listing_id to reviews table
ALTER TABLE reviews 
ADD COLUMN listing_id UUID REFERENCES listings(id);

-- Ensure a buyer can only review a seller once per listing
ALTER TABLE reviews
ADD CONSTRAINT unique_review_per_listing UNIQUE (listing_id, buyer_id);
