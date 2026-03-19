import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/sign-up");

  if (!user && !isAuthPage && request.nextUrl.pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Fetch profile to check role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "tenant";

    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname =
        role === "owner" ? "/owner/dashboard" : "/tenant/dashboard";
      return NextResponse.redirect(url);
    }

    if (request.nextUrl.pathname.startsWith("/owner") && role !== "owner") {
      const url = request.nextUrl.clone();
      url.pathname = "/tenant/dashboard";
      return NextResponse.redirect(url);
    }

    if (request.nextUrl.pathname.startsWith("/tenant") && role !== "tenant") {
      const url = request.nextUrl.clone();
      url.pathname = "/owner/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
