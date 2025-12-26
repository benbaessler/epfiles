"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useUser } from "@clerk/nextjs";

const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

function PostHogUserIdentifier() {
  if (!isProd) {
    return null;
  }

  return <PostHogUserIdentifierInner />;
}

function PostHogUserIdentifierInner() {
  const { user, isSignedIn } = useUser();
  const ph = usePostHog();

  useEffect(() => {
    if (isSignedIn && user) {
      ph.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName,
        created_at: user.createdAt?.toISOString(),
      });
    } else if (!isSignedIn) {
      ph.reset();
    }
  }, [ph, user, isSignedIn]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
      });
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogUserIdentifier />
      {children}
    </PHProvider>
  );
}




