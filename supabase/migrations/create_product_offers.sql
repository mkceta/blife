-- Create product_offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_offers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount_cents INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for product_offers
ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_offers' 
        AND policyname = 'Users can view offers they made or received'
    ) THEN
        CREATE POLICY "Users can view offers they made or received"
            ON product_offers FOR SELECT
            USING (
                auth.uid() = buyer_id OR 
                EXISTS (
                    SELECT 1 FROM listings 
                    WHERE listings.id = product_offers.listing_id 
                    AND listings.user_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_offers' 
        AND policyname = 'Users can insert offers as buyer'
    ) THEN
        CREATE POLICY "Users can insert offers as buyer"
            ON product_offers FOR INSERT
            WITH CHECK (auth.uid() = buyer_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_offers' 
        AND policyname = 'Users can update offers they are involved in'
    ) THEN
        CREATE POLICY "Users can update offers they are involved in"
            ON product_offers FOR UPDATE
            USING (
                auth.uid() = buyer_id OR 
                EXISTS (
                    SELECT 1 FROM listings 
                    WHERE listings.id = product_offers.listing_id 
                    AND listings.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Add type and offer_id to messages
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'type') THEN
        ALTER TABLE messages ADD COLUMN type TEXT DEFAULT 'text' CHECK (type IN ('text', 'offer'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'offer_id') THEN
        ALTER TABLE messages ADD COLUMN offer_id UUID REFERENCES product_offers(id) ON DELETE SET NULL;
    END IF;
END $$;
