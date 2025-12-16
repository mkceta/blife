import { redirect } from 'next/navigation'

/**
 * Root page - Fallback redirect
 * 
 * The actual auth-based redirect happens in middleware.ts for better performance.
 * This page only runs if middleware somehow doesn't redirect (edge case).
 * 
 * Flow:
 * - User visits "/" → Middleware checks auth
 *   - If logged in → redirect to /market
 *   - If not logged in → redirect to /landing
 */
export default function RootPage() {
  // Fallback: redirect to landing (middleware should have already handled this)
  redirect('/landing')
}
