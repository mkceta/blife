/**
 * Database Type Helpers
 * 
 * Provides convenient type exports for common database entities.
 * These types are manually maintained based on the Supabase schema.
 * 
 * @note In production, these should be generated automatically using:
 * `supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts`
 */

// Photo type for listing/flat images
export interface Photo {
    url: string
    alt?: string
}
export interface Listing {
    id: string
    created_at: string
    updated_at: string
    user_id: string
    title: string
    description: string
    price_cents: number
    category: string
    photos: { url: string }[] // Updated to match usage in components
    status: 'active' | 'reserved' | 'sold'
    is_hidden: boolean
    favorites_count: number
    views_count?: number
    brand?: string
    size?: string
    condition?: string
    location?: string
    // Joined user data (nullable when joined, omitted when not joined)
    user: {
        alias_inst: string
        rating_avg: number
        avatar_url?: string | null
    } | null
}

export interface Flat {
    id: string
    created_at: string
    updated_at: string
    user_id: string
    title: string
    description: string
    rent_cents: number
    photos: { url: string }[]
    rooms: number | null
    baths: number | null
    area_m2: number | null
    location_area?: string | null
    roommates_current?: number | null
    floor?: number | null
    is_elevator?: boolean | null
    is_furnished?: boolean | null
    is_pet_friendly?: boolean | null
    is_smoker_friendly?: boolean | null
    available_from?: string | null
    min_stay_months?: number | null
    precise_location?: { lat: number, lng: number } | null
    status: 'available' | 'reserved' | 'rented'
    features?: string[]
    favorites_count: number
    // Joined data
    user: {
        alias_inst: string
        avatar_url?: string | null
        rating_avg?: number
    } | null
}

export interface User {
    id: string
    email: string
    created_at: string
    alias_inst: string
    alias_anon?: string
    degree?: string
    bio?: string
    avatar_url?: string
    role: 'user' | 'admin'
    rating_avg?: number
    rating_count?: number
    stripe_account_id?: string
    stripe_connected: boolean
    last_seen?: string
}

export interface Message {
    id: string
    created_at: string
    conversation_id: string
    sender_id: string
    content: string
    read: boolean
    type: 'text' | 'image'
    reply_to_id?: string
    // Joined data
    sender?: User
    reply_to?: Message
}

export interface Conversation {
    id: string
    created_at: string
    updated_at: string
    user1_id: string
    user2_id: string
    listing_id?: string
    last_message_at: string
    // Joined data
    user1?: User
    user2?: User
    listing?: Listing
    last_message?: Message
}

export interface Notification {
    id: string
    created_at: string
    user_id: string
    type: string
    title: string
    message: string
    link: string | null
    read: boolean
    data?: Record<string, unknown>
    metadata?: Record<string, unknown>
}

export interface Post {
    id: string
    created_at: string
    updated_at: string
    user_id: string
    text: string
    photo_url?: string | null
    is_anonymous: boolean
    reactions_count: number
    comments_count: number
    is_hidden: boolean
    category?: string[]
    // Joined data
    user?: User | User[]
}

export interface Poll {
    id: string
    created_at: string
    user_id: string
    question: string
    category: 'general' | 'events' | 'questions' | 'offers'
    options: PollOption[]
    total_votes: number
    // Joined data
    user?: User
}

export interface PollOption {
    id: string
    poll_id: string
    option_text: string
    votes_count: number
}

export interface PollVote {
    id: string
    poll_id: string
    option_id: string
    user_id: string
    created_at: string
}

export interface Favorite {
    id: string
    user_id: string
    listing_id: string
    created_at: string
}

export interface Order {
    id: string
    created_at: string
    buyer_id: string
    seller_id: string
    listing_id: string
    amount_cents: number
    stripe_payment_intent_id?: string
    status: 'pending' | 'completed' | 'cancelled'
    // Joined data
    buyer?: User
    seller?: User
    listing?: Listing
}

export interface MessageReaction {
    id: string
    message_id: string
    user_id: string
    emoji: string
    created_at: string
}

/**
 * ChatMessage type for thread-based messaging system
 * Different from Message which is for conversation-based messaging
 */
export interface ChatMessage {
    id: string
    body: string
    created_at: string
    from_user: string
    thread_id: string
    read?: boolean
    type?: 'text' | 'offer'
    offer_id?: string
    offer?: unknown
    reply_to?: {
        id: string
        body: string
        from_user: string
    }
    reply_to_id?: string
    image_url?: string
}

// Utility types for inserts and updates
export type ListingInsert = Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'user' | 'favorites_count'>
export type ListingUpdate = Partial<ListingInsert>

export type PostInsert = Omit<Post, 'id' | 'created_at' | 'updated_at' | 'user' | 'reactions_count' | 'comments_count'>
export type PostUpdate = Partial<PostInsert>

export type MessageInsert = Omit<Message, 'id' | 'created_at' | 'sender' | 'reply_to'>
export type MessageUpdate = Partial<MessageInsert>

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'>
export type NotificationUpdate = Partial<NotificationInsert>

// Filter types for common queries
export interface MarketFilters {
    q?: string
    category?: string
    degree?: string
    minPrice?: number
    maxPrice?: number
    sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'most_liked' | string
    size?: string
    page?: number
    limit?: number
}

export interface CommunityFilters {
    category?: 'general' | 'events' | 'questions' | 'offers'
    sort?: 'newest' | 'oldest' | 'popular'
}

export interface ConversationFilters {
    userId: string
}

// Real-time subscription payload types
export interface RealtimePayload<T> {
    schema: string
    table: string
    commit_timestamp: string
    eventType: 'INSERT' | 'UPDATE' | 'DELETE'
    new: T
    old: T
    errors: unknown
}
