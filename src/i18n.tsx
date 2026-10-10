import { useEffect, useState, type CSSProperties } from 'react'
import { TEXTOS } from './textos'

export type Idioma = 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt-BR' | 'pt-PT'

/** Cada idioma con su nombre propio (así lo reconoce quien lo habla). */
export const IDIOMAS: { codigo: Idioma; nombre: string }[] = [
  { codigo: 'es', nombre: 'Español' },
  { codigo: 'en', nombre: 'English' },
  { codigo: 'fr', nombre: 'Français' },
  { codigo: 'de', nombre: 'Deutsch' },
  { codigo: 'it', nombre: 'Italiano' },
  { codigo: 'pt-BR', nombre: 'Português (Brasil)' },
  { codigo: 'pt-PT', nombre: 'Português (Portugal)' },
]

const CLAVE_GUARDADA = 'wkit_idioma'

/** Convierte un código de idioma del navegador ("fr-CA", "pt-AO"…) en uno de los nuestros. */
function aIdioma(codigo: string | null | undefined): Idioma | null {
  if (!codigo) return null
  const c = codigo.toLowerCase()
  if (c.startsWith('es')) return 'es'
  if (c.startsWith('en')) return 'en'
  if (c.startsWith('fr')) return 'fr'
  if (c.startsWith('de')) return 'de'
  if (c.startsWith('it')) return 'it'
  if (c.startsWith('pt')) {
    // "pt" solo o "pt-BR" → Brasil. Cualquier otro portugués (Portugal,
    // Angola, Mozambique…) → el de Portugal.
    return c === 'pt' || c === 'pt-br' ? 'pt-BR' : 'pt-PT'
  }
  return null
}

/**
 * Orden de prioridad:
 *  1. el idioma que la persona eligió a mano (se recuerda en este navegador);
 *  2. el que lleva el enlace (?idioma=fr), que pone la app Wkit con SU idioma;
 *  3. el idioma del navegador;
 *  4. español.
 */
function detectarIdioma(): Idioma {
  try {
    const guardado = aIdioma(window.localStorage.getItem(CLAVE_GUARDADA))
    if (guardado) return guardado
  } catch {
    /* navegación privada o almacenamiento bloqueado: se sigue sin recordar */
  }
  const delEnlace = aIdioma(new URLSearchParams(window.location.search).get('idioma'))
  if (delEnlace) return delEnlace
  for (const c of navigator.languages ?? [navigator.language]) {
    const i = aIdioma(c)
    if (i) return i
  }
  return 'es'
}

let idiomaActual: Idioma = detectarIdioma()
const oyentes = new Set<() => void>()

function aplicarAlDocumento() {
  document.documentElement.lang = idiomaActual
  document.title = `Wkit — ${t('Territorios')}`
}

export function cambiarIdioma(nuevo: Idioma) {
  idiomaActual = nuevo
  try {
    window.localStorage.setItem(CLAVE_GUARDADA, nuevo)
  } catch {
    /* no pasa nada: solo no se recordará */
  }
  aplicarAlDocumento()
  oyentes.forEach((avisar) => avisar())
}

/** Traduce un texto (la clave es el texto en español). Si falta, se ve en español. */
export function t(texto: string, valores?: Record<string, string | number>): string {
  const traducido = idiomaActual === 'es' ? texto : TEXTOS[texto]?.[idiomaActual] ?? texto
  if (!valores) return traducido
  return traducido.replace(/\{(\w+)\}/g, (_, nombre: string) => String(valores[nombre] ?? `{${nombre}}`))
}

/** "aaaa-mm-dd" → fecha en el formato del idioma. Sin pasar por UTC, que puede cambiar el día. */
export function formatearFecha(iso?: string): string {
  if (!iso) return '—'
  const [anio, mes, dia] = iso.split('-').map(Number)
  if (!anio || !mes || !dia) return iso
  return new Date(anio, mes - 1, dia).toLocaleDateString(idiomaActual)
}

/** Hace que el componente que lo usa se vuelva a pintar cuando cambia el idioma. */
export function useIdioma() {
  const [, repintar] = useState(0)
  useEffect(() => {
    const avisar = () => repintar((n) => n + 1)
    oyentes.add(avisar)
    return () => {
      oyentes.delete(avisar)
    }
  }, [])
  return { idioma: idiomaActual, cambiarIdioma }
}

const estiloSelector: CSSProperties = {
  position: 'fixed',
  top: 10,
  right: 12,
  zIndex: 100,
  fontSize: 12,
  padding: '4px 6px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  color: 'var(--color-text-primary)',
}

/** El desplegable para elegir idioma. Está en todas las pantallas del panel. */
export function SelectorIdioma() {
  const { idioma } = useIdioma()
  return (
    <select
      aria-label={t('Idioma')}
      value={idioma}
      onChange={(e) => cambiarIdioma(e.target.value as Idioma)}
      style={estiloSelector}
    >
      {IDIOMAS.map((i) => (
        <option key={i.codigo} value={i.codigo}>
          {i.nombre}
        </option>
      ))}
    </select>
  )
}

aplicarAlDocumento()
