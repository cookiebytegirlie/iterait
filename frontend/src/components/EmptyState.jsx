// Reusable centered empty state — title + optional description/action.
export default function EmptyState({ title, description, actionButton }) {
  return (
    <div className="rounded-[14px] border border-dashed border-border bg-surface p-10 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
      {actionButton && <div className="mt-4">{actionButton}</div>}
    </div>
  )
}
