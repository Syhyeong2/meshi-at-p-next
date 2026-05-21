import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseEnv } from "./env";
import type { Database } from "./types";

function isAuthRoute(pathname: string): boolean {
  return pathname === "/login" || pathname === "/signup";
}

function isProtectedRoute(pathname: string): boolean {
  return (
    pathname === "/home" ||
    pathname.startsWith("/home/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

function redirectWithSessionCookies(request: NextRequest, response: NextResponse, path: string) {
  const redirectResponse = NextResponse.redirect(new URL(path, request.url));

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (isAuthRoute(pathname) && !hasSupabaseAuthCookie(request)) {
    return NextResponse.next({
      request,
    });
  }

  let response = NextResponse.next({
    request,
  });
  const { url, publishableKey } = getPublicSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims.sub);

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    return redirectWithSessionCookies(request, response, "/login");
  }

  if (isAuthRoute(pathname) && isAuthenticated && !searchParams.has("auth")) {
    return redirectWithSessionCookies(request, response, "/home/places");
  }

  return response;
}
