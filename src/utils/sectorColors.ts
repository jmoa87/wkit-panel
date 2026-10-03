import type { Sector } from '../api/types'

// Paleta de 16 colores vivos y bien distintos entre sí (tonos muy
// separados, para que dos sectores contiguos no se confundan en el mapa).
// Dos filas de 8: rojo, naranja, amarillo, lima, verde, turquesa, cian,
// azul / violeta, morado, magenta, rosa, marrón, granate, azul marino,
// oliva.
export const PALETA_COLORES = [
  '#E6194B', '#F58231', '#FFD400', '#A4D500', '#1FAA3C', '#00A99D', '#1EC8F0', '#2F6BFF',
  '#4B2FD0', '#A020F0', '#E91EC3', '#FF6FA8', '#8B4A1F', '#9B1B30', '#0B2E8A', '#6B8E23',
]

/** Mapa sectorId → color, tomado del color explícito de cada sector. */
export function coloresPorSector(sectores: Sector[]): Record<string, string> {
  const mapa: Record<string, string> = {}
  sectores.forEach((sector) => {
    mapa[sector.id] = sector.color
  })
  return mapa
}
