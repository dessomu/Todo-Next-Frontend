import { NextResponse } from "next/server";

export function proxy(req) {
  const session = req.cookies.get("session_marker")?.value;
  console.log("middlewre hits now", session);

  const path = req.nextUrl.pathname;

  if (!session && path !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (session && path === "/login") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home", "/login"], // protected routes
};
