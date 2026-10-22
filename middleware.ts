import {NextRequest, NextResponse} from "next/server";
import {verifyAccessToken} from "@/lib/arena-access";

const protectedRoutes = ["/arena", "/mission-map", "/play", "/projects"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const protectedRoute = protectedRoutes.find((route) => pathname === route || pathname.startsWith(route + "/"));
  if (!protectedRoute) return NextResponse.next();

  const claims = await verifyAccessToken(request.cookies.get("arena_access")?.value);
  if (claims) return NextResponse.next();

  const destination = request.nextUrl.clone();
  destination.pathname = "/access";
  destination.search = "";
  destination.searchParams.set("next", pathname + request.nextUrl.search);
  return NextResponse.redirect(destination);
}

export const config = {
  matcher: ["/arena/:path*", "/mission-map/:path*", "/play/:path*", "/projects/:path*"],
};
