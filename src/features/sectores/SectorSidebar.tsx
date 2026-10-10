import { t } from '../../i18n'
import { useState } from 'react'
import type { Campana, Sector, Territorio } from '../../api/types'
import { CampanaCard } from '../campanas/CampanaCard'

interface SectorSidebarProps {
  sectores: Sector[]
  territorios: Territorio[]
  sectorSeleccionadoId: string | null
  territorioSeleccionadoId: string | null
  coloresPorSector: Record<string, string>
  onSeleccionarSector: (sectorId: string | null) => void
  onSeleccionarTerritorio: (territorioId: string) => void
  onCrearSector: () => void
  onEditarSector: (sector: Sector) => void
  onCrearTerritorio: () => void
  onReordenar: (nuevoOrden: string[]) => void
  campana: Campana | null
  onCrearCampana: () => void
  onEliminarCampana: () => void
}

export function SectorSidebar({
  sectores,
  territorios,
  sectorSeleccionadoId,
  territorioSeleccionadoId,
  coloresPorSector,
  onSeleccionarSector,
  onSeleccionarTerritorio,
  onCrearSector,
  onEditarSector,
  onCrearTerritorio,
  onReordenar,
  campana,
  onCrearCampana,
  onEliminarCampana,
}: SectorSidebarProps) {
  const [arrastrandoId, setArrastrandoId] = useState<string | null>(null)
  const [sobreId, setSobreId] = useState<string | null>(null)
  const sectorActivo = sectores.find((s) => s.id === sectorSeleccionadoId) ?? null

  if (sectorActivo) {
    const territoriosDelSector = territorios
      .filter((t) => t.sectorId === sectorActivo.id)
      .sort((a, b) => a.numero.localeCompare(b.numero, undefined, { numeric: true }))

    return (
      <nav>
        <button
          onClick={() => onSeleccionarSector(null)}
          style={{ ...botonBase, color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}
        >
          {t("← Sectores")}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            marginBottom: 'var(--spacing-sm)',
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: coloresPorSector[sectorActivo.id],
              flexShrink: 0,
            }}
          />
          {sectorActivo.nombre}
          <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>
            ({territoriosDelSector.length})
          </span>
          <button
            onClick={onCrearTerritorio}
            title={t("Crear territorio")}
            style={{
              marginLeft: 'auto',
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: 'none',
              background: 'var(--color-accent)',
              color: 'white',
              fontSize: 13,
              lineHeight: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            +
          </button>
          <button
            onClick={() => onEditarSector(sectorActivo)}
            title={t("Editar sector")}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              color: 'var(--color-text-secondary)',
              padding: 4,
            }}
          >
            ✏️
          </button>
        </div>

        {territoriosDelSector.map((territorio) => (
          <button
            key={territorio.id}
            onClick={() => onSeleccionarTerritorio(territorio.id)}
            style={{
              ...botonBase,
              justifyContent: 'flex-start',
              gap: 8,
              background:
                territorio.id === territorioSeleccionadoId ? 'var(--color-accent-muted)' : 'transparent',
              color:
                territorio.id === territorioSeleccionadoId
                  ? 'var(--color-accent)'
                  : 'var(--color-text-primary)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: coloresPorSector[sectorActivo.id],
                flexShrink: 0,
              }}
            />
            {t("Territorio {numero}", { numero: territorio.numero })}
          </button>
        ))}
      </nav>
    )
  }

  return (
    <nav>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--spacing-sm)',
        }}
      >
        <div style={{ fontWeight: 600 }}>{t("Sectores")}</div>
        <button
          onClick={onCrearSector}
          title={t("Crear sector")}
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
      </div>

      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
        {t("Mantén pulsado y arrastra ⠿ para cambiar el orden")}
      </div>

      {sectores.map((sector) => {
        const total = territorios.filter((t) => t.sectorId === sector.id).length
        return (
          <div
            key={sector.id}
            draggable
            onDragStart={() => setArrastrandoId(sector.id)}
            onDragOver={(e) => {
              e.preventDefault()
              if (sector.id !== sobreId) setSobreId(sector.id)
            }}
            onDragLeave={() => setSobreId((actual) => (actual === sector.id ? null : actual))}
            onDrop={(e) => {
              e.preventDefault()
              setSobreId(null)
              if (!arrastrandoId || arrastrandoId === sector.id) return

              const ids = sectores.map((s) => s.id)
              const desde = ids.indexOf(arrastrandoId)
              const hasta = ids.indexOf(sector.id)
              ids.splice(desde, 1)
              ids.splice(hasta, 0, arrastrandoId)
              onReordenar(ids)
              setArrastrandoId(null)
            }}
            onDragEnd={() => {
              setArrastrandoId(null)
              setSobreId(null)
            }}
            style={{
              opacity: arrastrandoId === sector.id ? 0.4 : 1,
              borderTop: sobreId === sector.id ? '2px solid var(--color-accent)' : '2px solid transparent',
            }}
          >
            <button onClick={() => onSeleccionarSector(sector.id)} style={botonBase}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--color-text-secondary)', cursor: 'grab', fontSize: 13 }}>⠿</span>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: coloresPorSector[sector.id],
                    flexShrink: 0,
                  }}
                />
                {sector.nombre}
              </span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{total}</span>
            </button>
          </div>
        )
      })}

      <CampanaCard campana={campana} onCrear={onCrearCampana} onEliminar={onEliminarCampana} />
    </nav>
  )
}

const botonBase: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  textAlign: 'left',
  padding: 'var(--spacing-sm)',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  marginBottom: 2,
  background: 'transparent',
  fontSize: 13,
}
