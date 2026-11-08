import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight route hints for P0. Full cookie-based auth guard comes with BFF cookies.
export function middleware(request: NextRequest) {
  void request;
  return NextResponse.next();
}

export const config = {
  matcher: ["/member/:path*", "/onboarding/:path*", "/admin/:path*"],
};
