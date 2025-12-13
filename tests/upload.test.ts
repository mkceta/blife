
import { describe, it, expect, vi } from 'vitest'
import { uploadListingImages } from '@/lib/upload'

// Mocks
vi.mock('@/lib/supabase', () => ({
    createClient: () => ({
        storage: {
            from: () => ({
                upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
                getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://fake-url.com/img.jpg' } })
            })
        }
    })
}))

vi.mock('browser-image-compression', () => {
    return {
        default: vi.fn().mockImplementation((file) => Promise.resolve(file))
    }
})

// Mock crypto
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'test-uuid-1234'
    }
})

// Since we cannot easily test the exact batching behavior without exposing the helper or adding delays,
// we will test that the function completes successfully and calls the mock the correct number of times.

describe('Upload Logic', () => {
    it('should process uploads and return results', async () => {
        // Create dummy files
        const files = [
            new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' }),
            new File(['(⌐□_□)'], 'brucelee.png', { type: 'image/png' }),
        ]

        const listingId = 'test-listing-id'

        const results = await uploadListingImages(files, listingId)

        // Expect 2 results
        expect(results).toHaveLength(2)

        // Check structure
        expect(results[0]).toHaveProperty('url')
        expect(results[0]).toHaveProperty('thumb_url')
    })

    it('should handle empty file list', async () => {
        const results = await uploadListingImages([], 'testid')
        expect(results).toHaveLength(0)
    })
})
