import { t } from '../i18n'
interface SaveToastProps {
  numero: string
  sectorNombre: string
  onCancelar: () => void
  onOk: () => void
}

export function SaveToast({ numero, sectorNombre, onCancelar, onOk }: SaveToastProps) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        width: 220,
        zIndex: 60,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t("Cambios guardados")}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
        {t("Territorio {numero}", { numero })} · {sectorNombre}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onCancelar}
          style={{
            flex: 1,
            padding: '5px 0',
            fontSize: 12,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border)',
            background: 'transparent',
            color: 'var(--color-text-primary)',
          }}
        >
          {t("Cancelar cambios")}
        </button>
        <button
          onClick={onOk}
          style={{
            flex: 1,
            padding: '5px 0',
            fontSize: 12,
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: 'var(--color-accent)',
            color: 'white',
            fontWeight: 600,
          }}
        >
          {t("Guardar")}
        </button>
      </div>
    </div>
  )
}
