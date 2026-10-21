// Opening a case study slides in slightly from the right: "going deeper" from the list.
export default function CaseStudyTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-detail-enter motion-reduce:animate-none">{children}</div>;
}
