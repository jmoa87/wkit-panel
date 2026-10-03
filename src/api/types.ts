export type TipoSector = 'urbano' | 'rural' | 'negocios'

export interface Sector {
  id: string
  congregacionId: string
  nombre: string
  tipo: TipoSector
  color: string
}

export type EstadoTerritorio = 'disponible' | 'asignado' | 'vencido'

/** Coordenadas del polígono como pares [longitud, latitud], formato GeoJSON. */
export type Poligono = [number, number][]

export interface Territorio {
  id: string
  sectorId: string
  numero: string
  estado: EstadoTerritorio
  poligono: Poligono
  enCampana: boolean
  publicadorAsignado?: string
  fechaInicio?: string
  fechaLimite?: string
  fechaUltimaDevolucion?: string
}

export interface Congregacion {
  id: string
  nombre: string
}
