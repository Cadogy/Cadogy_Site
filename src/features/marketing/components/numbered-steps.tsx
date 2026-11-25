export function NumberedSteps({
  label,
  steps,
}: {
  label: string
  steps: readonly string[]
}) {
  return (
    <ol aria-label={label} className="rule-list">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-5 py-4">
          <span className="w-6 shrink-0 pt-0.5 text-meta tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  )
}
