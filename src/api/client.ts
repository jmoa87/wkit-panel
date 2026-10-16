import { createClient } from '@supabase/supabase-js'
import type { Campana, Congregacion, Sector, Territorio, TipoSector } from './types'

// Mismo proyecto de Supabase que usa la app de iOS — es la misma base
// de datos, así que un territorio asignado aquí se ve también en la
// app al instante, y viceversa.
const supabase = createClient(
  'https://xnbezrcvhokepbgevyhx.supabase.co',
  'sb_publishable_UNoVh7uK9Q2aMMMqJiepgw_NngO3pJr'
)

// La clave llega en la URL (?clave=...) y se guarda aquí una sola vez,
// al arrancar — cada función de abajo la manda en cada petición; el
// servidor es quien de verdad comprueba que es válida y de qué
// congregación es, nunca nos lo inventamos en el navegador.
let clave = ''
export function establecerClave(c: string) {
  clave = c
}

// --- Formas tal como las devuelve Supabase (en inglés, snake_case) ---
interface FilaSector {
  id: string
  name: string
  kind: string
  color: string
}

interface FilaTerritorio {
  id: string
  sector_id: string | null
  number: string
  polygon: Territorio['poligono'] | null
  status: string
  assigned_member_id: string | null
  start_date: string | null
  due_date: string | null
  last_return_date: string | null
}

function sectorDesdeFila(f: FilaSector): Sector {
  return { id: f.id, congregacionId: '', nombre: f.name, tipo: f.kind as TipoSector, color: f.color }
}

function territorioDesdeFila(f: FilaTerritorio): Territorio {
  return {
    id: f.id,
    sectorId: f.sector_id ?? '',
    numero: f.number,
    estado: f.status === 'asignado' ? 'asignado' : 'disponible',
    poligono: f.polygon ?? [],
    enCampana: false,
    publicadorAsignado: f.assigned_member_id ?? undefined,
    fechaInicio: f.start_date ?? undefined,
    fechaLimite: f.due_date ?? undefined,
    fechaUltimaDevolucion: f.last_return_date ?? undefined,
  }
}

export async function obtenerCongregacionActual(): Promise<Congregacion> {
  const { data, error } = await supabase.rpc('panel_info', { p_token: clave })
  if (error) throw error
  const fila = data?.[0]
  if (!fila) throw new Error('No se encontró la congregación para esta clave.')
  return { id: clave, nombre: fila.congregation_name }
}

export async function obtenerSectores(_congregacionId: string): Promise<Sector[]> {
  const { data, error } = await supabase.rpc('panel_listar_sectores', { p_token: clave })
  if (error) throw error
  return (data ?? []).map(sectorDesdeFila)
}

export async function obtenerTerritorios(sectorId?: string): Promise<Territorio[]> {
  const { data, error } = await supabase.rpc('panel_listar_territorios', { p_token: clave })
  if (error) throw error
  const todos: Territorio[] = (data ?? []).map(territorioDesdeFila)
  return sectorId ? todos.filter((t) => t.sectorId === sectorId) : todos
}

export async function crearSector(datos: { nombre: string; tipo: Sector['tipo']; color: string }): Promise<Sector> {
  const { data: idNuevo, error } = await supabase.rpc('panel_crear_sector', {
    p_token: clave,
    p_name: datos.nombre,
    p_kind: datos.tipo,
    p_color: datos.color,
  })
  if (error) throw error
  return { id: idNuevo as string, congregacionId: '', ...datos }
}

export async function actualizarSector(
  id: string,
  cambios: Partial<Pick<Sector, 'nombre' | 'tipo' | 'color'>>
): Promise<Sector> {
  // El panel siempre manda los tres campos a la vez (ver
  // EditarSectorModal), así que no hace falta leer antes para rellenar
  // huecos — si algún día cambia eso, habría que leer el sector actual
  // primero.
  const { error } = await supabase.rpc('panel_editar_sector', {
    p_token: clave,
    p_sector: id,
    p_name: cambios.nombre,
    p_kind: cambios.tipo,
    p_color: cambios.color,
  })
  if (error) throw error
  return { id, congregacionId: '', nombre: cambios.nombre!, tipo: cambios.tipo!, color: cambios.color! }
}

interface FilaCampana {
  id: string
  name: string
  start_date: string
  end_date: string
  total: number
  asignados: number
  completados: number
}

/** La campaña activa, o null si no hay ninguna. Es la misma que ve la app. */
export async function obtenerCampanaActiva(): Promise<Campana | null> {
  const { data, error } = await supabase.rpc('panel_campana_activa', { p_token: clave })
  if (error) throw error
  const fila = data as FilaCampana | null
  if (!fila) return null
  return {
    id: fila.id,
    nombre: fila.name,
    inicio: fila.start_date,
    fin: fila.end_date,
    total: fila.total,
    asignados: fila.asignados,
    completados: fila.completados,
  }
}

/** Crea la campaña y copia de golpe todos los territorios actuales. */
export async function crearCampana(datos: { nombre: string; inicio: string; fin: string }): Promise<void> {
  const { error } = await supabase.rpc('panel_crear_campana', {
    p_token: clave,
    p_name: datos.nombre,
    p_start: datos.inicio,
    p_end: datos.fin,
  })
  if (error) throw error
}

/** Elimina la campaña y todas sus asignaciones. Los territorios normales no se tocan. */
export async function eliminarCampana(id: string): Promise<void> {
  const { error } = await supabase.rpc('panel_eliminar_campana', { p_token: clave, p_campaign: id })
  if (error) throw error
}

export async function reordenarSectores(ids: string[]): Promise<void> {
  const { error } = await supabase.rpc('panel_reordenar_sectores', { p_token: clave, p_orden: ids })
  if (error) throw error
}

export async function actualizarTerritorio(
  id: string,
  cambios: Partial<Pick<Territorio, 'numero' | 'sectorId' | 'poligono'>>
): Promise<Territorio> {
  const { error } = await supabase.rpc('panel_editar_territorio', {
    p_token: clave,
    p_territory: id,
    p_number: cambios.numero,
    p_polygon: cambios.poligono,
  })
  if (error) throw error
  const todos = await obtenerTerritorios()
  const actualizado = todos.find((t) => t.id === id)
  if (!actualizado) throw new Error('No se encontró el territorio tras guardarlo.')
  return actualizado
}

export async function crearTerritorio(datos: {
  sectorId: string
  numero: string
  poligono: Territorio['poligono']
}): Promise<Territorio> {
  const { data: idNuevo, error } = await supabase.rpc('panel_crear_territorio', {
    p_token: clave,
    p_sector: datos.sectorId,
    p_number: datos.numero,
    p_polygon: datos.poligono,
  })
  if (error) throw error
  const todos = await obtenerTerritorios()
  const creado = todos.find((t) => t.id === idNuevo)
  if (!creado) throw new Error('No se encontró el territorio recién creado.')
  return creado
}

export async function eliminarTerritorio(id: string): Promise<void> {
  const { error } = await supabase.rpc('panel_eliminar_territorio', { p_token: clave, p_territory: id })
  if (error) throw error
}

export async function asignarTerritorio(id: string, miembroId: string): Promise<void> {
  const { error } = await supabase.rpc('panel_asignar_territorio', {
    p_token: clave,
    p_territory: id,
    p_member: miembroId,
  })
  if (error) throw error
}

export async function devolverTerritorio(id: string): Promise<void> {
  const { error } = await supabase.rpc('panel_devolver_territorio', { p_token: clave, p_territory: id })
  if (error) throw error
}

export async function obtenerPublicadores(): Promise<{ id: string; nombre: string }[]> {
  const { data, error } = await supabase.rpc('panel_listar_publicadores', { p_token: clave })
  if (error) throw error
  return (data ?? []).map((f: { id: string; full_name: string }) => ({ id: f.id, nombre: f.full_name }))
}
