import createIntlMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);
const authSecret = process.env.AUTH_SECRET?.trim();
const { auth } = NextAuth(authConfig);

function runProtectedRouteChecks(
  request: NextRequest & { auth: unknown }
) {
  const session = request.auth as { user?: { role?: string } } | null;
  const { pathname } = request.nextUrl;
  const locale = pathname.split("/")[1] ?? "ar";

  const protectedAccount = /^\/(ar|en)\/dashboard(\/|$)/.test(pathname);
  const protectedAdmin = /^\/(ar|en)\/admin(\/|$)/.test(pathname);

  if ((protectedAccount || protectedAdmin) && !session?.user) {
    return Response.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (protectedAdmin && session?.user?.role !== "ADMIN") {
    return Response.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return intlMiddleware(request);
}

const middleware = authSecret
  ? auth(runProtectedRouteChecks)
  : (request: NextRequest) => {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "[middleware] AUTH_SECRET is not set — auth route protection disabled until configured."
        );
      }
      return intlMiddleware(request);
    };

export default middleware;

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
