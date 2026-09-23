import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/sign-out"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (pathname === "/") {
    return NextResponse.redirect(new URL(user ? "/home" : "/login", req.url));
  }

  if (!user && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (!user && pathname.startsWith("/api")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  return res;
}
