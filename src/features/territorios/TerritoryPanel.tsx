import { useState } from 'react'
import type { Sector, Territorio } from '../../api/types'

interface Publicador {
  id: string
  nombre: string
}

interface TerritoryPanelProps {
  territorioOriginal: Territorio | null
  borrador: Territorio | null
  sectores: Sector[]
  publicadores: Publicador[]
  editandoVertices: boolean
  modoCreacion: boolean
  onCambiarCampo: (cambios: Partial<Territorio>) => void
  onIniciarEdicionVertices: () => void
  onTerminarEdicionVertices: () => void
  onGuardar: () => void
  onAsignar: (publicadorId: string) => void
  onDevolver: () => void
  onEliminar: () => void
}

export function TerritoryPanel({
  territorioOriginal,
  borrador,
  sectores,
  publicadores,
  editandoVertices,
  modoCreacion,
  onCambiarCampo,
  onIniciarEdicionVertices,
  onTerminarEdicionVertices,
  onGuardar,
  onAsignar,
  onDevolver,
  onEliminar,
}: TerritoryPanelProps) {
  const [publicadorElegido, setPublicadorElegido] = useState('')

  if (!borrador || !territorioOriginal) {
    return (
      <div style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
        Selecciona un territorio en el mapa o en la lista.
      </div>
    )
  }

  const hayCambios = JSON.stringify(borrador) !== JSON.stringify(territorioOriginal)
  const puedeGuardar = modoCreacion ? borrador.numero.trim().length > 0 : hayCambios

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onGuardar()
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-md)' }}>
        {modoCreacion ? 'Nuevo territorio' : `Territorio ${territorioOriginal.numero}`}
      </div>

      <Campo etiqueta="Número">
        <input
          value={borrador.numero}
          onChange={(e) => onCambiarCampo({ numero: e.target.value })}
          style={inputStyle}
          autoFocus={modoCreacion}
        />
      </Campo>

      <Campo etiqueta="Sector">
        <select
          value={borrador.sectorId}
          onChange={(e) => onCambiarCampo({ sectorId: e.target.value })}
          style={inputStyle}
        >
          {sectores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </Campo>

      {!modoCreacion && (
        <Campo etiqueta="Asignación">
          {territorioOriginal.publicadorAsignado ? (
            <div
              style={{
                padding: 'var(--spacing-sm)',
                background: 'var(--color-background)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
              }}
            >
              <div style={{ color: 'var(--color-text-secondary)', marginBottom: 4 }}>Asignado a</div>
              <div style={{ marginBottom: 6 }}>
                {publicadores.find((p) => p.id === territorioOriginal.publicadorAsignado)?.nombre ??
                  territorioOriginal.publicadorAsignado}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                <span>Desde {formatoFecha(territorioOriginal.fechaInicio)}</span>
                <span>Hasta {formatoFecha(territorioOriginal.fechaLimite)}</span>
              </div>
              <button type="button" onClick={onDevolver} style={botonSecundario}>
                Marcar como devuelto
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={publicadorElegido}
                onChange={(e) => setPublicadorElegido(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="">Elegir publicador…</option>
                {publicadores.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!publicadorElegido}
                onClick={() => {
                  onAsignar(publicadorElegido)
                  setPublicadorElegido('')
                }}
                style={{
                  ...botonPrimario,
                  width: 'auto',
                  padding: '6px 12px',
                  opacity: publicadorElegido ? 1 : 0.5,
                  cursor: publicadorElegido ? 'pointer' : 'default',
                }}
              >
                Asignar
              </button>
            </div>
          )}
        </Campo>
      )}

      <button
        type="button"
        onClick={editandoVertices ? onTerminarEdicionVertices : onIniciarEdicionVertices}
        style={{
          width: '100%',
          padding: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-sm)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: editandoVertices ? 'var(--color-accent-muted)' : 'transparent',
          color: editandoVertices ? 'var(--color-accent)' : 'var(--color-text-primary)',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {editandoVertices ? 'Terminar edición del territorio' : 'Editar territorio'}
      </button>

      {!modoCreacion && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`¿Eliminar el territorio ${territorioOriginal.numero}? No se puede deshacer.`)) {
              onEliminar()
            }
          }}
          style={{
            width: '100%',
            padding: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-sm)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid #B51700',
            background: 'transparent',
            color: '#B51700',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Eliminar territorio
        </button>
      )}

      {modoCreacion && (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
          Arrastra los puntos sobre el mapa para darle la forma real, y pon su número antes de crearlo.
        </div>
      )}

      <button
        type="submit"
        disabled={!puedeGuardar || editandoVertices}
        style={{
          width: '100%',
          padding: 'var(--spacing-sm)',
          borderRadius: 'var(--radius-sm)',
          border: 'none',
          background: puedeGuardar && !editandoVertices ? 'var(--color-accent)' : 'var(--color-border)',
          color: puedeGuardar && !editandoVertices ? 'white' : 'var(--color-text-secondary)',
          fontSize: 13,
          fontWeight: 600,
          cursor: puedeGuardar && !editandoVertices ? 'pointer' : 'default',
        }}
      >
        {modoCreacion ? 'Crear territorio' : 'Guardar cambios'}
      </button>
    </form>
  )
}

function formatoFecha(iso?: string): string {
  if (!iso) return '—'
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
        {etiqueta}
      </div>
      {children}
    </div>
  )
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
  borderRadius: 'var(--radius-sm)',
  border: 'none',
  background: 'var(--color-accent)',
  color: 'white',
  fontSize: 13,
  fontWeight: 600,
}

const botonSecundario: React.CSSProperties = {
  width: '100%',
  padding: '6px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'transparent',
  color: 'var(--color-text-primary)',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}
