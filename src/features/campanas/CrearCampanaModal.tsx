import { useState } from 'react'

interface CrearCampanaModalProps {
  onCrear: (datos: { nombre: string; inicio: string; fin: string }) => void
  onCerrar: () => void
}

/** "aaaa-mm-dd" de una fecha, en la hora local (no en UTC, que a ciertas
 * horas daría el día anterior o el siguiente). */
function aTexto(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export function CrearCampanaModal({ onCrear, onCerrar }: CrearCampanaModalProps) {
  const hoy = new Date()
  const enUnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate())

  const [nombre, setNombre] = useState('')
  const [inicio, setInicio] = useState(aTexto(hoy))
  const [fin, setFin] = useState(aTexto(enUnMes))

  const fechasValidas = inicio !== '' && fin !== '' && fin >= inicio
  const puedeCrear = nombre.trim() !== '' && fechasValidas

  function crear() {
    if (!puedeCrear) return
    onCrear({ nombre: nombre.trim(), inicio, fin })
  }

  return (
    <div style={fondoStyle} onClick={onCerrar}>
      <div style={tarjetaStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>Nueva campaña</div>

        <Campo etiqueta="Nombre">
          <input
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Cursos bíblicos"
            style={inputStyle}
          />
        </Campo>

        <Campo etiqueta="Empieza">
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} style={inputStyle} />
        </Campo>

        <Campo etiqueta="Termina">
          <input type="date" value={fin} min={inicio} onChange={(e) => setFin(e.target.value)} style={inputStyle} />
        </Campo>

        {!fechasValidas && inicio !== '' && fin !== '' && (
          <div style={{ fontSize: 12, color: '#B51700', marginBottom: 'var(--spacing-sm)' }}>
            La campaña no puede acabar antes de empezar.
          </div>
        )}

        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
          Se crea una copia de todos los territorios actuales, lista para repartir aparte. Los territorios
          normales no se tocan: siguen asignados a quien los tuviera.
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCerrar} style={botonSecundario}>
            Cancelar
          </button>
          <button onClick={crear} disabled={!puedeCrear} style={{ ...botonPrimario, opacity: puedeCrear ? 1 : 0.5 }}>
            Crear campaña
          </button>
        </div>
      </div>
    </div>
  )
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{etiqueta}</div>
      {children}
    </div>
  )
}

const fondoStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
}

const tarjetaStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-md)',
  padding: 'var(--spacing-lg)',
  width: 300,
  boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  fontSize: 13,
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background)',
  color: 'var(--color-text-primary)',
}

const botonPrimario: React.CSSProperties = {
  flex: 1,
  padding: 'var(--spacing-sm)',
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  background: 'var(--color-accent)',
  color: 'white',
  fontSize: 13,
  fontWeight: 600,
}

const botonSecundario: React.CSSProperties = {
  flex: 1,
  padding: 'var(--spacing-sm)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-primary)',
  fontSize: 13,
}
