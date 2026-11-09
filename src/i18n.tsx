import { useEffect, useState, type CSSProperties } from 'react'
import { TEXTOS } from './textos'

export type Idioma =
  | 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt-BR' | 'pt-PT'
  | 'ru' | 'pl' | 'ro' | 'tr' | 'zh' | 'ja' | 'ko' | 'ar' | 'nl' | 'sv' | 'fi' | 'nb'
  | 'ca' | 'cs' | 'hr' | 'da' | 'sk' | 'sl' | 'el' | 'he' | 'hu' | 'hi' | 'id' | 'ms' | 'th' | 'uk' | 'vi'

/** Cada idioma con su nombre propio (así lo reconoce quien lo habla). */
export const IDIOMAS: { codigo: Idioma; nombre: string }[] = [
  { codigo: 'es', nombre: 'Español' },
  { codigo: 'en', nombre: 'English' },
  { codigo: 'fr', nombre: 'Français' },
  { codigo: 'de', nombre: 'Deutsch' },
  { codigo: 'it', nombre: 'Italiano' },
  { codigo: 'pt-BR', nombre: 'Português (Brasil)' },
  { codigo: 'pt-PT', nombre: 'Português (Portugal)' },
  { codigo: 'ru', nombre: 'Русский' },
  { codigo: 'pl', nombre: 'Polski' },
  { codigo: 'ro', nombre: 'Română' },
  { codigo: 'tr', nombre: 'Türkçe' },
  { codigo: 'zh', nombre: '简体中文' },
  { codigo: 'ja', nombre: '日本語' },
  { codigo: 'ko', nombre: '한국어' },
  { codigo: 'ar', nombre: 'العربية' },
  { codigo: 'nl', nombre: 'Nederlands' },
  { codigo: 'sv', nombre: 'Svenska' },
  { codigo: 'fi', nombre: 'Suomi' },
  { codigo: 'nb', nombre: 'Norsk bokmål' },
  { codigo: 'ca', nombre: 'Català' },
  { codigo: 'cs', nombre: 'Čeština' },
  { codigo: 'hr', nombre: 'Hrvatski' },
  { codigo: 'da', nombre: 'Dansk' },
  { codigo: 'sk', nombre: 'Slovenčina' },
  { codigo: 'sl', nombre: 'Slovenščina' },
  { codigo: 'el', nombre: 'Ελληνικά' },
  { codigo: 'he', nombre: 'עברית' },
  { codigo: 'hu', nombre: 'Magyar' },
  { codigo: 'hi', nombre: 'हिन्दी' },
  { codigo: 'id', nombre: 'Bahasa Indonesia' },
  { codigo: 'ms', nombre: 'Bahasa Melayu' },
  { codigo: 'th', nombre: 'ไทย' },
  { codigo: 'uk', nombre: 'Українська' },
  { codigo: 'vi', nombre: 'Tiếng Việt' },
]

const CLAVE_GUARDADA = 'wkit_idioma'

/** Convierte un código de idioma del navegador ("fr-CA", "pt-AO"…) en uno de los nuestros. */
function aIdioma(codigo: string | null | undefined): Idioma | null {
  if (!codigo) return null
  const c = codigo.toLowerCase()
  if (c.startsWith('pt')) {
    // "pt" solo o "pt-BR" → Brasil. Cualquier otro portugués (Portugal,
    // Angola, Mozambique…) → el de Portugal.
    return c === 'pt' || c === 'pt-br' ? 'pt-BR' : 'pt-PT'
  }
  const base = c.split(/[-_]/)[0]
  if (base === 'no' || base === 'nn') return 'nb' // noruego (bokmål)
  const propios: Idioma[] = ['es', 'en', 'fr', 'de', 'it', 'ru', 'pl', 'ro', 'tr', 'zh', 'ja', 'ko', 'ar', 'nl', 'sv', 'fi', 'nb', 'ca', 'cs', 'hr', 'da', 'sk', 'sl', 'el', 'he', 'hu', 'hi', 'id', 'ms', 'th', 'uk', 'vi']
  return propios.find((i) => i === base) ?? null
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
  document.documentElement.lang = idiomaActual === 'zh' ? 'zh-Hans' : idiomaActual
  // El árabe y el hebreo se leen de derecha a izquierda.
  document.documentElement.dir = idiomaActual === 'ar' || idiomaActual === 'he' ? 'rtl' : 'ltr'
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
  return new Date(anio, mes - 1, dia).toLocaleDateString(idiomaActual === 'zh' ? 'zh-Hans' : idiomaActual)
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
