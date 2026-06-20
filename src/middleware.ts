import createIntlMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);
const { auth } = NextAuth(authConfig);

export default auth((request: NextRequest & { auth: unknown }) => {
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
});

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
