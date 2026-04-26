import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NOTE: Supabase JS v2 stores the auth session in localStorage (client-side),
// which is not accessible to the Next.js middleware (server-side).
// Auth protection is handled client-side in src/app/page.tsx using the useAuth hook.
// This middleware is intentionally kept as a no-op.

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
