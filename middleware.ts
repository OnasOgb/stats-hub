import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/shared/lib/database.types";
import { logger } from "@/shared/lib/logger";

const PUBLIC_PATHS = ["/auth", "/auth/callback"];
const mwLogger = logger.child({ module: "middleware" });

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets, PWA files, Next.js internals — no logging
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico" ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  const start = Date.now();
  const method = request.method;

  try {
    const response = NextResponse.next();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (getUserError) {
      mwLogger.error({ err: getUserError, method, path: pathname }, "middleware: getUser failed");
    }

    const userId = user?.id ?? null;

    const isPublicPath = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    // Redirect unauthenticated users to /auth
    if (!user && !isPublicPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth";
      url.searchParams.set("next", pathname);
      const duration = Date.now() - start;
      mwLogger.info({ method, path: pathname, duration, userId }, "request completed");
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from /auth
    if (user && isPublicPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      const duration = Date.now() - start;
      mwLogger.info({ method, path: pathname, duration, userId }, "request completed");
      return NextResponse.redirect(url);
    }

    const duration = Date.now() - start;
    mwLogger.info({ method, path: pathname, duration, userId }, "request completed");
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    mwLogger.error({ method, path: pathname, duration, err: error }, "middleware error");
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
