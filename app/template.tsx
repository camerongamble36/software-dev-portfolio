// Templates remount on navigation, so this CSS animation replays for each top-level
// page change. Pure CSS: content is never hidden waiting for JavaScript, and
// prefers-reduced-motion turns it off.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-enter motion-reduce:animate-none">{children}</div>;
}
