import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-secondary">
        That page doesn&apos;t exist (or hasn&apos;t been written yet).
      </p>
      <Link href="/" className={cn("mt-6", buttonVariants())}>
        Back home
      </Link>
    </div>
  );
}
