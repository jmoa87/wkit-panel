import { useState } from 'react'
import type { TipoSector } from '../../api/types'
import { PALETA_COLORES } from '../../utils/sectorColors'

interface CrearSectorModalProps {
  coloresUsados: string[]
  onCrear: (datos: { nombre: string; tipo: TipoSector; color: string }) => void
  onCerrar: () => void
}

const etiquetaTipo: Record<TipoSector, string> = {
  urbano: 'Urbano',
  rural: 'Rural',
  negocios: 'Negocios',
}

export function CrearSectorModal({ coloresUsados, onCrear, onCerrar }: CrearSectorModalProps) {
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoSector>('urbano')
  const primerColorLibre = PALETA_COLORES.find((c) => !coloresUsados.includes(c)) ?? PALETA_COLORES[0]
  const [color, setColor] = useState(primerColorLibre)

  function crear() {
    if (!nombre.trim()) return
    onCrear({ nombre: nombre.trim(), tipo, color })
  }

  return (
    <div style={fondoStyle} onClick={onCerrar}>
      <div style={tarjetaStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>Nuevo sector</div>

        <Campo etiqueta="Nombre">
          <input
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Zagrilla"
            style={inputStyle}
          />
        </Campo>

        <Campo etiqueta="Tipo">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoSector)} style={inputStyle}>
            {Object.entries(etiquetaTipo).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>
                {etiqueta}
              </option>
            ))}
          </select>
        </Campo>

        <Campo etiqueta="Color">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gap: 8, padding: 3 }}>
            {PALETA_COLORES.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                title={c}
                style={{
                  // Se ajustan al ancho de la tarjeta (nunca se salen) y
                  // quedan centrados en su hueco.
                  width: '100%',
                  maxWidth: 28,
                  aspectRatio: '1 / 1',
                  justifySelf: 'center',
                  borderRadius: '50%',
                  background: c,
                  border: c === color ? '2px solid var(--color-text-primary)' : '2px solid transparent',
                  outline: c === color ? '2px solid var(--color-surface)' : 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </Campo>

        <div style={{ display: 'flex', gap: 8, marginTop: 'var(--spacing-md)' }}>
          <button onClick={onCerrar} style={botonSecundario}>
            Cancelar
          </button>
          <button onClick={crear} disabled={!nombre.trim()} style={botonPrimario}>
            Crear sector
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
  width: 280,
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
