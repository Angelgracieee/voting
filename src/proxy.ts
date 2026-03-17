import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const protectedPaths = ["/dashboard", "/api/dashboard"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const email = String((token as { email?: string } | null)?.email ?? "").toLowerCase();

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/api/auth/signin";
    return NextResponse.redirect(url);
  }

  if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
    return new NextResponse("Access denied", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/api/dashboard"],
};