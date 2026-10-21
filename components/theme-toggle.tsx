"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { buttonVariants } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // Icons swap via CSS (the `dark:` variant reads data-theme), so the server
  // render matches the client and there is no hydration flash.
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      data-testid="theme-toggle"
      className={buttonVariants({ variant: "ghost", size: "icon" })}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun aria-hidden className="hidden dark:block" />
      <Moon aria-hidden className="dark:hidden" />
    </button>
  );
}
