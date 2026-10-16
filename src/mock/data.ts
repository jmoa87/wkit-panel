import type { Congregacion, Sector, Territorio } from '../api/types'

export const congregacionEjemplo: Congregacion = {
  id: 'cong-priego',
  nombre: 'Priego de Córdoba',
}

export const sectoresEjemplo: Sector[] = [
  { id: 'sec-priego', congregacionId: 'cong-priego', nombre: 'Priego de Córdoba', tipo: 'urbano', color: '#0F6E56' },
  { id: 'sec-carcabuey', congregacionId: 'cong-priego', nombre: 'Carcabuey', tipo: 'urbano', color: '#185FA5' },
  { id: 'sec-almedinilla', congregacionId: 'cong-priego', nombre: 'Almedinilla', tipo: 'urbano', color: '#D85A30' },
  { id: 'sec-rural', congregacionId: 'cong-priego', nombre: 'Territorio Rural (Aldeas)', tipo: 'rural', color: '#3B6D11' },
  { id: 'sec-negocios', congregacionId: 'cong-priego', nombre: 'Territorio de negocios', tipo: 'negocios', color: '#534AB7' },
]

// Coordenadas orientativas alrededor del centro de Priego de Córdoba
// (37.4392, -4.1975), solo para tener polígonos de ejemplo en el mapa.
const centro: [number, number] = [-4.1975, 37.4392]

function poligonoDeEjemplo(offsetLng: number, offsetLat: number): Territorio['poligono'] {
  const [lng, lat] = centro
  return [
    [lng + offsetLng, lat + offsetLat + 0.003],
    [lng + offsetLng + 0.004, lat + offsetLat + 0.003],
    [lng + offsetLng + 0.004, lat + offsetLat - 0.003],
    [lng + offsetLng, lat + offsetLat - 0.003],
  ]
}

export const territoriosEjemplo: Territorio[] = [
  {
    id: 'ter-12',
    sectorId: 'sec-priego',
    numero: '12',
    estado: 'disponible',
    poligono: poligonoDeEjemplo(0, 0),
    enCampana: false,
    fechaUltimaDevolucion: '2025-04-01',
  },
  {
    id: 'ter-07',
    sectorId: 'sec-priego',
    numero: '07',
    estado: 'asignado',
    poligono: poligonoDeEjemplo(0.006, 0),
    enCampana: false,
    publicadorAsignado: 'María López',
    fechaInicio: '2025-08-01',
    fechaLimite: '2025-12-01',
  },
  {
    id: 'ter-03',
    sectorId: 'sec-carcabuey',
    numero: '03',
    estado: 'vencido',
    poligono: poligonoDeEjemplo(-0.03, -0.02),
    enCampana: false,
    publicadorAsignado: 'Jorge Ruiz',
    fechaInicio: '2025-02-01',
    fechaLimite: '2025-06-01',
  },
  {
    id: 'ter-r01',
    sectorId: 'sec-rural',
    numero: 'R-01',
    estado: 'disponible',
    poligono: poligonoDeEjemplo(0.02, 0.025),
    enCampana: true,
  },
  ...Array.from({ length: 6 }, (_, i) => ({
    id: `ter-p${i + 20}`,
    sectorId: 'sec-priego',
    numero: String(20 + i).padStart(2, '0'),
    estado: (['disponible', 'asignado', 'vencido'] as const)[i % 3],
    poligono: poligonoDeEjemplo(-0.01 + i * 0.004, 0.008),
    enCampana: false,
    ...(i % 3 !== 0
      ? {
          publicadorAsignado: ['Ana Torres', 'Pedro Sánchez'][i % 2],
          fechaInicio: '2025-07-01',
          fechaLimite: '2025-11-01',
        }
      : {}),
  })),
]
