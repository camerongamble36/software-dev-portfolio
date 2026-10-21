import Link from "next/link";
import { site } from "@/content/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="border-b border-line-subtle bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <Link
          href="/"
          className="rounded-md py-2 text-base font-semibold tracking-tight whitespace-nowrap"
        >
          {site.name}
        </Link>
        <nav aria-label="Main" className="flex items-center sm:gap-1">
          <Link
            href="/case-studies"
            className={cn(buttonVariants({ variant: "ghost" }), "px-2 sm:px-4")}
          >
            Case studies
          </Link>
          {site.chatEnabled && (
            <Link href="/chat" className={buttonVariants({ variant: "ghost" })}>
              Chat
            </Link>
          )}
          <a
            href={site.githubUrl}
            aria-label="GitHub profile"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <GithubIcon />
          </a>
          {site.linkedinUrl && (
            // No room at phone widths; the hero and footer carry the link there.
            <a
              href={site.linkedinUrl}
              aria-label="LinkedIn profile"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "hidden sm:inline-flex",
              )}
            >
              <LinkedinIcon />
            </a>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
