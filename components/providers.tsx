"use client";

import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { AudienceProvider } from "@/components/audience/audience-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {/* Honour prefers-reduced-motion for every motion component. */}
      <MotionConfig reducedMotion="user">
        <AudienceProvider>{children}</AudienceProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
