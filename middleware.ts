import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Temporary middleware noop.
// Supabase SSR middleware needs @supabase/ssr or an equivalent setup that matches this project.
// Keeping this file compiling to unblock the Next.js build.
export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}


