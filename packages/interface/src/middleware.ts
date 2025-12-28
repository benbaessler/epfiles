import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

export default function middleware(request: NextRequest) {
  // #region agent log
  console.log('[DEBUG-MIDDLEWARE]', JSON.stringify({location:'middleware.ts',message:'middleware invoked',data:{isProd,envValue:process.env.NEXT_PUBLIC_APP_ENV,path:request.nextUrl.pathname},timestamp:Date.now(),hypothesisId:'H6'}));
  // #endregion

  if (!isProd) {
    return NextResponse.next();
  }

  return clerkMiddleware()(request, {} as never);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};




