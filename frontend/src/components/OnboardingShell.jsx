import logo from '/iterait-logo.svg'

// Shared chrome for onboarding screens: gradient backdrop, centered white
// card, logo, optional step dots. Visual language matches the rest of the
// app (index.css tokens) — not the old multi-platform sync/import flow.
export default function OnboardingShell({ step, totalSteps, cardWidth = 440, children }) {
  return (
    <div className="bg-gradient-hero flex min-h-screen items-center justify-center p-4">
      <div className="w-full rounded-[14px] bg-surface p-10 shadow-[var(--shadow-pop)]" style={{ maxWidth: cardWidth }}>
        <div className="mb-6 flex flex-col items-center">
          <img src={logo} alt="" className="h-9 w-9" />
          {totalSteps > 1 && (
            <div className="mt-4 flex gap-1.5">
              {Array.from({ length: totalSteps }, (_, i) => (
                <span key={i} className={`h-1 w-5 rounded-full ${i < step ? 'bg-ink' : 'bg-border'}`} />
              ))}
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
