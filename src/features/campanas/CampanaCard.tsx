import { t, formatearFecha } from '../../i18n'
import type { Campana } from '../../api/types'

interface CampanaCardProps {
  campana: Campana | null
  onCrear: () => void
  onEliminar: () => void
}

/** "aaaa-mm-dd" -> "dd/mm/aaaa", sin pasar por Date (que con las zonas
 * horarias puede cambiar el día). */
function formatoFecha(texto: string): string {
  return formatearFecha(texto)
}

/** La campaña activa de la congregación: crearla si no hay ninguna, o
 * ver cómo va y eliminarla. Es la misma que ve la app. */
export function CampanaCard({ campana, onCrear, onEliminar }: CampanaCardProps) {
  function confirmarEliminar() {
    if (!campana) return
    const aviso =
      t('¿Eliminar la campaña «{nombre}»?', { nombre: campana.nombre }) +
      '\n\n' +
      t('Se borran también todas sus asignaciones. Los territorios normales no se ven afectados.')
    if (window.confirm(aviso)) onEliminar()
  }

  return (
    <div
      style={{
        marginTop: 'var(--spacing-lg)',
        paddingTop: 'var(--spacing-md)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontWeight: 600 }}>{t("Campaña")}</div>
        {!campana && (
          <button
            onClick={onCrear}
            title={t("Crear campaña")}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--color-accent)',
              color: 'white',
              fontSize: 14,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        )}
      </div>

      {!campana ? (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
          {t("No hay ninguna campaña activa. Al crearla se copia la lista de territorios actual, lista para repartir aparte.")}
        </div>
      ) : (
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            padding: 'var(--spacing-sm)',
            fontSize: 13,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{campana.nombre}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
            {formatoFecha(campana.inicio)} – {formatoFecha(campana.fin)}
          </div>
          <div style={{ fontSize: 12, marginBottom: 8 }}>
            {t("{asignados} de {total} asignados · {completados} completados", { asignados: campana.asignados, total: campana.total, completados: campana.completados })}
          </div>
          <button
            onClick={confirmarEliminar}
            style={{
              width: '100%',
              padding: 'var(--spacing-xs, 6px)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #B51700',
              background: 'transparent',
              color: '#B51700',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {t("Eliminar campaña")}
          </button>
        </div>
      )}
    </div>
  )
}
