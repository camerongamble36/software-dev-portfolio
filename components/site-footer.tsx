import { site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line-subtle">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-secondary sm:flex-row sm:justify-between sm:px-6">
        <p>© {site.name}</p>
        <p>
          Built with Next.js.{" "}
          <a href={site.repoUrl} className="text-link underline underline-offset-4">
            Source on GitHub
          </a>
        </p>
      </div>
    </footer>
  );
}
