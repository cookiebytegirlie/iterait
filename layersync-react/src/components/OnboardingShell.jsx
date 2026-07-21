import colorLogo from '../assets/Color-Logo.png'

export default function OnboardingShell({ step, totalSteps, cardWidth = 480, children }) {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #4DC8C4, #7BB8E8, #F5B08A, #F08080)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: cardWidth,
        background: 'var(--surface)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '40px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <img src={colorLogo} alt="iterait" style={{ height: 26, display: 'block' }} />
          {totalSteps > 1 && (
            <div style={{ display: 'flex', gap: '5px', marginTop: '16px' }}>
              {Array.from({ length: totalSteps }, (_, i) => (
                <span key={i} style={{
                  width: '20px',
                  height: '4px',
                  borderRadius: '2px',
                  background: i < step ? 'var(--primary)' : 'var(--border)',
                }} />
              ))}
            </div>
          )}
        </div>

        {children}
      </div>
    </div>
  )
}
