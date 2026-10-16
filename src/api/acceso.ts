import { createClient } from '@supabase/supabase-js'

// Cliente aparte, solo para entrar con la contraseña: no guarda ninguna
// sesión propia de Supabase (la sesión del panel es la que devuelve
// panel_desbloquear y se guarda en este mismo archivo).
const supabase = createClient(
  'https://xnbezrcvhokepbgevyhx.supabase.co',
  'sb_publishable_UNoVh7uK9Q2aMMMqJiepgw_NngO3pJr',
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export type ResultadoDesbloqueo =
  | { ok: true; sesion: string }
  | { ok: false; bloqueado: boolean; restantes?: number }

/** Entra con el enlace (clave) y la contraseña de 6 cifras. */
export async function desbloquearPanel(clave: string, pin: string): Promise<ResultadoDesbloqueo> {
  const { data, error } = await supabase.rpc('panel_desbloquear', { p_token: clave, p_pin: pin })
  if (error) throw error
  const r = data as { ok: boolean; sesion?: string; bloqueado?: boolean; restantes?: number }
  if (r.ok && r.sesion) return { ok: true, sesion: r.sesion }
  return { ok: false, bloqueado: !!r.bloqueado, restantes: r.restantes }
}

// La sesión se recuerda en este navegador, ligada a este enlace: así no
// hay que escribir la contraseña cada vez, pero sí en un navegador nuevo.
function claveAlmacen(clave: string) {
  return `wkit_panel_sesion_${clave.slice(0, 16)}`
}

export function sesionGuardada(clave: string): string | null {
  try {
    return localStorage.getItem(claveAlmacen(clave))
  } catch {
    return null
  }
}

export function guardarSesion(clave: string, sesion: string) {
  try {
    localStorage.setItem(claveAlmacen(clave), sesion)
  } catch {
    /* sin almacenamiento: tendrá que escribir la contraseña cada vez */
  }
}

export function olvidarSesion(clave: string) {
  try {
    localStorage.removeItem(claveAlmacen(clave))
  } catch {
    /* nada */
  }
}
