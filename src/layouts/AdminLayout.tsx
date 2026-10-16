import type { ReactNode } from 'react'

interface AdminLayoutProps {
  titulo: string
  sidebar: ReactNode
  mapa: ReactNode
  panel: ReactNode
}

export function AdminLayout({ titulo, sidebar, mapa, panel }: AdminLayoutProps) {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          padding: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 4,
            color: 'var(--color-text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: 5,
              background: 'var(--color-accent)',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            W
          </span>
          WKIT
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{titulo}</div>
      </header>

      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '220px 1fr 260px',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-md)',
          minHeight: 0,
        }}
      >
        <aside style={panelStyle}>{sidebar}</aside>
        <main style={{ ...panelStyle, padding: 0, overflow: 'hidden' }}>{mapa}</main>
        <aside style={panelStyle}>{panel}</aside>
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  padding: 'var(--spacing-md)',
  overflow: 'auto',
}
