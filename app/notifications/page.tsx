import { redirect } from 'next/navigation'

/**
 * Notifications Page - Server Component (Redirect)
 * 
 * Redirects to unified inbox with notifications tab
 */
export default function NotificationsPage() {
    // Server-side redirect (more efficient than client-side)
    redirect('/messages?tab=notifications')
}
