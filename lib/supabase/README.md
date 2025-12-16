# Supabase Client Usage Guide

This directory contains the Supabase client configurations for different contexts.

## 📁 Files Overview

- **`client.ts`** - For client components (browser)
- **`server.ts`** - For server components and server actions
- **`admin.ts`** - For admin operations with elevated permissions

---

## 🎯 When to Use Each Client

### 1. `client.ts` - Client Components

**Use when:**
- You're in a client component (marked with `'use client'`)
- You need to interact with Supabase from the browser
- You're building interactive features (forms, real-time subscriptions, etc.)

**Example:**
```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function MyClientComponent() {
  const supabase = createClient()
  const [data, setData] = useState([])
  
  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('listings').select('*')
      setData(data || [])
    }
    fetchData()
  }, [])
  
  return <div>{/* render data */}</div>
}
```

---

### 2. `server.ts` - Server Components & Actions

**Use when:**
- You're in a server component (default in Next.js App Router)
- You're writing a server action
- You need server-side rendering with user context

**Example - Server Component:**
```tsx
import { createServerClient } from '@/lib/supabase/server'

export default async function MyPage() {
  const supabase = await createServerClient()
  const { data } = await supabase.from('listings').select('*')
  
  return <div>{/* render data */}</div>
}
```

**Example - Server Action:**
```tsx
'use server'
import { createServerClient } from '@/lib/supabase/server'

export async function createListing(formData: FormData) {
  const supabase = await createServerClient()
  
  const { error } = await supabase
    .from('listings')
    .insert({ title: formData.get('title') })
  
  if (error) return { error: error.message }
  return { success: true }
}
```

---

### 3. `admin.ts` - Admin Operations

**Use when:**
- You need to bypass Row Level Security (RLS) policies
- You're performing admin-only operations
- You're doing bulk operations or system maintenance

**⚠️ IMPORTANT:** This client uses the service role key and bypasses all RLS policies. Use with extreme caution.

**Example:**
```tsx
'use server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function adminDeleteUser(userId: string) {
  const supabase = createAdminClient()
  
  // This bypasses RLS - only possible with admin client
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)
  
  if (error) return { error: error.message }
  return { success: true }
}
```

---

## ⚡ Quick Decision Tree

```
Are you in a client component?
├─ YES → Use client.ts
└─ NO → Are you performing admin operations?
    ├─ YES → Use admin.ts
    └─ NO → Use server.ts
```

---

## 🔐 Security Notes

| Client | RLS Applied | Auth Context | Expose to Frontend |
|--------|-------------|--------------|-------------------|
| `client.ts` | ✅ Yes | User session | ✅ Safe |
| `server.ts` | ✅ Yes | User session | ✅ Safe |
| `admin.ts` | ❌ **No** | Service role | ⛔ **NEVER** |

**CRITICAL:** Never import or use `admin.ts` in client components or expose the service role key to the frontend.

---

## 📚 Additional Resources

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side)
- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Row Level Security (RLS)](https://supabase.com/docs/guides/auth/row-level-security)
