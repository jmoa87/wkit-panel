import { useEffect, useState } from 'react'
import { t, formatearFecha } from '../../i18n'
import { LONGITUD_MAXIMA_NOTA, anadirNota, eliminarNota, obtenerNotas } from '../../api/client'
import type { NotaTerritorio } from '../../api/types'

/**
 * Las notas de un territorio (p. ej. quién no desea visitas), debajo de los botones de la
 * asignación. Todos los hermanos las ven en la app; desde el panel se pueden escribir y borrar.
 * La fecha (solo el día) la pone el servidor.
 */
export function NotasTerritorio({ territorioId }: { territorioId: string }) {
  const [notas, setNotas] = useState<NotaTerritorio[]>([])
  const [cargando, setCargando] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    setNotas([])
    setError(null)
    obtenerNotas(territorioId)
      .then((n) => {
        if (vigente) setNotas(n)
      })
      .catch(() => {
        /* sin conexión: se deja la lista vacía */
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [territorioId])

  async function recargar() {
    try {
      setNotas(await obtenerNotas(territorioId))
    } catch {
      /* se deja lo que había */
    }
  }

  async function anadir() {
    const nueva = texto.trim()
    if (!nueva) return
    setEnviando(true)
    setError(null)
    try {
      await anadirNota(territorioId, nueva)
      setTexto('')
      await recargar()
    } catch {
      setError(t("No se pudo guardar la nota."))
    } finally {
      setEnviando(false)
    }
  }

  async function eliminar(nota: NotaTerritorio) {
    if (!window.confirm(t("¿Eliminar esta nota?"))) return
    setError(null)
    try {
      await eliminarNota(nota.id)
      setNotas((actuales) => actuales.filter((n) => n.id !== nota.id))
    } catch {
      setError(t("No se pudo eliminar la nota."))
    }
  }

  const puedeAnadir = texto.trim().length > 0 && !enviando

  return (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{t("Notas")}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
        {t("Nunca incluyas nombres personales. Solo la dirección que no se deja visitar.")}
      </div>

      {!cargando && notas.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
          {t("Todavía no hay notas.")}
        </div>
      )}

      {notas.map((n) => (
        <div
          key={n.id}
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            padding: 'var(--spacing-sm)',
            marginBottom: 6,
            background: 'var(--color-background)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'var(--color-text-secondary)', marginBottom: 2 }}>{formatearFecha(n.fecha)}</div>
            <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{n.texto}</div>
          </div>
          <button
            type="button"
            onClick={() => eliminar(n)}
            aria-label={t("Eliminar")}
            title={t("Eliminar")}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#B51700',
              fontSize: 16,
              lineHeight: 1,
              cursor: 'pointer',
              padding: 2,
            }}
          >
            ×
          </button>
        </div>
      ))}

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value.slice(0, LONGITUD_MAXIMA_NOTA))}
        placeholder={t("Escribe una nota…")}
        maxLength={LONGITUD_MAXIMA_NOTA}
        rows={2}
        style={{
          width: '100%',
          padding: '6px 8px',
          fontSize: 13,
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-background)',
          color: 'var(--color-text-primary)',
          resize: 'vertical',
          fontFamily: 'inherit',
          marginBottom: 6,
        }}
      />
      <button
        type="button"
        disabled={!puedeAnadir}
        onClick={anadir}
        style={{
          width: '100%',
          padding: '6px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'transparent',
          color: 'var(--color-text-primary)',
          fontSize: 12,
          fontWeight: 600,
          opacity: puedeAnadir ? 1 : 0.5,
          cursor: puedeAnadir ? 'pointer' : 'default',
        }}
      >
        {t("Añadir")}
      </button>
      {error && <div style={{ fontSize: 12, color: '#B51700', marginTop: 6 }}>{error}</div>}
    </div>
  )
}
