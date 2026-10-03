import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Poligono, Territorio } from '../../api/types'

interface TerritoryMapProps {
  territorios: Territorio[]
  territorioSeleccionadoId: string | null
  coloresPorSector: Record<string, string>
  onSeleccionar: (territorioId: string) => void
  /** El territorio seleccionado con sus cambios pendientes (sin guardar
   * todavía). Si existe, su polígono sustituye siempre al guardado, tanto
   * si se están arrastrando vértices ahora mismo como si no. */
  borrador: Territorio | null
  editandoVertices: boolean
  colorEdicion: string
  onCambiarPoligono: (coords: Poligono) => void
  onCancelarEdicion: () => void
}

export interface TerritoryMapHandle {
  /** El centro exacto del mapa ahora mismo, preguntado directamente —
   * no depende de que el usuario haya movido el mapa antes. */
  obtenerCentro: () => [number, number] | null
}

type Feature = {
  type: 'Feature'
  geometry: { type: 'Polygon'; coordinates: number[][][] }
  properties: { id: string; sectorId: string; estado: string; numero: string }
}
type FeatureCollection = { type: 'FeatureCollection'; features: Feature[] }

function colorDeToken(nombre: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(nombre).trim() || '#888888'
}

function aGeoJSON(territorios: Territorio[], borrador?: { id: string; coords: Poligono } | null): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: territorios.map((t) => {
      const coords = borrador && borrador.id === t.id ? borrador.coords : t.poligono
      return {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[...coords, coords[0]]] },
        properties: { id: t.id, sectorId: t.sectorId, estado: t.estado, numero: t.numero },
      }
    }),
  }
}

function expresionColorPorSector(
  coloresPorSector: Record<string, string>
): maplibregl.ExpressionSpecification | string {
  const entradas = Object.entries(coloresPorSector)
  if (entradas.length === 0) return '#888888'
  const pares = entradas.flatMap(([sectorId, color]) => [sectorId, color])
  return ['match', ['get', 'sectorId'], ...pares, '#888888'] as unknown as maplibregl.ExpressionSpecification
}

function creaMarcadorVertice(color: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.width = '12px'
  el.style.height = '12px'
  el.style.background = 'white'
  el.style.border = `2px solid ${color}`
  el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)'
  el.style.cursor = 'grab'
  return el
}

function creaMarcadorMedio(color: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.width = '9px'
  el.style.height = '9px'
  el.style.background = color
  el.style.opacity = '0.5'
  el.style.border = '1px solid white'
  el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)'
  el.style.cursor = 'copy'
  return el
}

function creaMarcadorMover(color: string): HTMLDivElement {
  const el = document.createElement('div')
  el.style.width = '28px'
  el.style.height = '28px'
  el.style.borderRadius = '50%'
  el.style.background = color
  el.style.border = '2px solid white'
  el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)'
  el.style.cursor = 'grab'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>'
  return el
}

export const TerritoryMap = forwardRef<TerritoryMapHandle, TerritoryMapProps>(function TerritoryMap({
  territorios,
  territorioSeleccionadoId,
  coloresPorSector,
  onSeleccionar,
  borrador,
  editandoVertices,
  colorEdicion,
  onCambiarPoligono,
  onCancelarEdicion,
}: TerritoryMapProps, ref) {
  const contenedorRef = useRef<HTMLDivElement>(null)
  const mapaRef = useRef<maplibregl.Map | null>(null)
  const verticesRef = useRef<maplibregl.Marker[]>([])
  const mediosRef = useRef<maplibregl.Marker[]>([])
  const coordsRef = useRef<Poligono>([])
  const editandoRef = useRef(false)

  useImperativeHandle(ref, () => ({
    obtenerCentro: () => {
      if (!mapaRef.current) return null
      const centro = mapaRef.current.getCenter()
      return [centro.lng, centro.lat]
    },
  }))

  const [listo, setListo] = useState(false)

  const expresionColor = useMemo(() => expresionColorPorSector(coloresPorSector), [coloresPorSector])

  useEffect(() => {
    editandoRef.current = editandoVertices
  }, [editandoVertices])

  // Inicialización del mapa (una sola vez).
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return
    let cancelado = false

    const mapa = new maplibregl.Map({
      container: contenedorRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [-4.1975, 37.4392],
      zoom: 14,
    })

    const iniciarCapas = () => {
      if (cancelado) return
      if (!mapa.isStyleLoaded()) {
        mapa.once('styledata', iniciarCapas)
        return
      }

      mapa.addSource('territorios', { type: 'geojson', data: aGeoJSON([]) })
      mapa.addLayer({
        id: 'territorios-relleno',
        type: 'fill',
        source: 'territorios',
        paint: { 'fill-color': expresionColor, 'fill-opacity': 0.35 },
      })
      mapa.addLayer({
        id: 'territorios-borde',
        type: 'line',
        source: 'territorios',
        paint: { 'line-color': expresionColor, 'line-width': 2 },
      })
      mapa.addLayer({
        id: 'territorios-edicion-borde',
        type: 'line',
        source: 'territorios',
        filter: ['==', ['get', 'id'], ''],
        paint: { 'line-color': '#D1373F', 'line-width': 3, 'line-dasharray': [2, 1.5] },
      })
      mapa.addLayer({
        id: 'territorios-seleccionado',
        type: 'line',
        source: 'territorios',
        filter: ['==', ['get', 'id'], ''],
        paint: { 'line-color': colorDeToken('--color-accent'), 'line-width': 4 },
      })

      mapa.on('click', 'territorios-relleno', (e) => {
        if (editandoRef.current) return
        const id = e.features?.[0]?.properties?.id
        if (id) onSeleccionar(id)
      })
      mapa.on('mouseenter', 'territorios-relleno', () => {
        if (!editandoRef.current) mapa.getCanvas().style.cursor = 'pointer'
      })
      mapa.on('mouseleave', 'territorios-relleno', () => {
        mapa.getCanvas().style.cursor = ''
      })

      setListo(true)
    }

    mapa.on('load', iniciarCapas)
    mapaRef.current = mapa
    return () => {
      cancelado = true
      mapa.remove()
      mapaRef.current = null
      setListo(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // El polígono mostrado es SIEMPRE el del borrador si hay uno para ese
  // territorio — con cambios pendientes o sin ellos, editando o no.
  useEffect(() => {
    if (!listo) return
    const fuente = mapaRef.current?.getSource('territorios') as maplibregl.GeoJSONSource | undefined
    fuente?.setData(aGeoJSON(territorios, borrador ? { id: borrador.id, coords: borrador.poligono } : null))
  }, [territorios, borrador, listo])

  useEffect(() => {
    if (!listo) return
    mapaRef.current?.setFilter('territorios-seleccionado', [
      '==',
      ['get', 'id'],
      territorioSeleccionadoId ?? '',
    ])
  }, [territorioSeleccionadoId, listo])

  useEffect(() => {
    if (!listo) return
    mapaRef.current?.setFilter('territorios-edicion-borde', [
      '==',
      ['get', 'id'],
      editandoVertices && borrador ? borrador.id : '',
    ])
  }, [editandoVertices, borrador, listo])

  useEffect(() => {
    if (!listo || !mapaRef.current) return
    mapaRef.current.setPaintProperty('territorios-relleno', 'fill-color', expresionColor)
    mapaRef.current.setPaintProperty('territorios-borde', 'line-color', expresionColor)
  }, [expresionColor, listo])

  useEffect(() => {
    if (!listo || !mapaRef.current || editandoVertices) return
    const territorio = territorios.find((t) => t.id === territorioSeleccionadoId)
    if (!territorio || territorio.poligono.length === 0) return
    const lngs = territorio.poligono.map((c) => c[0])
    const lats = territorio.poligono.map((c) => c[1])
    mapaRef.current.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding: 80, duration: 700 }
    )
  }, [territorioSeleccionadoId, listo])

  // Editor de vértices. Los puntos intermedios siguen la línea en vivo
  // cuando arrastras un vértice vecino (antes se quedaban clavados).
  useEffect(() => {
    if (!listo || !mapaRef.current) return
    const mapa = mapaRef.current
    const fuente = () => mapa.getSource('territorios') as maplibregl.GeoJSONSource | undefined

    function limpiar() {
      verticesRef.current.forEach((m) => m.remove())
      mediosRef.current.forEach((m) => m.remove())
      verticesRef.current = []
      mediosRef.current = []
    }

    function actualizarFuente() {
      if (!borrador) return
      fuente()?.setData(aGeoJSON(territorios, { id: borrador.id, coords: coordsRef.current }))
    }

    function centroide(): [number, number] {
      const coords = coordsRef.current
      const suma = coords.reduce((acc, [lng, lat]) => [acc[0] + lng, acc[1] + lat], [0, 0])
      return [suma[0] / coords.length, suma[1] / coords.length]
    }

    function medioDe(i: number): [number, number] {
      const coords = coordsRef.current
      const siguiente = coords[(i + 1) % coords.length]
      return [(coords[i][0] + siguiente[0]) / 2, (coords[i][1] + siguiente[1]) / 2]
    }

    function dibujar() {
      limpiar()
      const coords = coordsRef.current

      coords.forEach((coord, i) => {
        const marcador = new maplibregl.Marker({ element: creaMarcadorVertice(colorEdicion), draggable: true })
          .setLngLat(coord)
          .addTo(mapa)

        marcador.on('drag', () => {
          const { lng, lat } = marcador.getLngLat()
          coordsRef.current[i] = [lng, lat]
          actualizarFuente()
          onCambiarPoligono([...coordsRef.current])

          // Los puntos intermedios vecinos siguen la línea en vivo.
          const n = coordsRef.current.length
          mediosRef.current[i]?.setLngLat(medioDe(i))
          mediosRef.current[(i - 1 + n) % n]?.setLngLat(medioDe((i - 1 + n) % n))
          marcadorCentro?.setLngLat(centroide())
        })

        verticesRef.current.push(marcador)
      })

      coords.forEach((_, i) => {
        const marcador = new maplibregl.Marker({ element: creaMarcadorMedio(colorEdicion), draggable: true })
          .setLngLat(medioDe(i))
          .addTo(mapa)

        marcador.on('drag', () => {
          const { lng, lat } = marcador.getLngLat()
          const previo = [...coordsRef.current]
          previo.splice(i + 1, 0, [lng, lat])
          if (borrador) fuente()?.setData(aGeoJSON(territorios, { id: borrador.id, coords: previo }))
        })

        marcador.on('dragend', () => {
          const { lng, lat } = marcador.getLngLat()
          coordsRef.current.splice(i + 1, 0, [lng, lat])
          onCambiarPoligono([...coordsRef.current])
          dibujar() // el punto pasa a ser vértice real; se recrean los intermedios vecinos
          marcadorCentro?.setLngLat(centroide())
        })

        mediosRef.current.push(marcador)
      })
    }

    if (!editandoVertices || !borrador) {
      limpiar()
      return
    }

    coordsRef.current = borrador.poligono.map((c) => [c[0], c[1]])
    dibujar()

    // Icono central para arrastrar el territorio entero de una vez —
    // aparte, para no confundirlo con pulsar sobre el relleno sin
    // querer mientras se editan los vértices.
    let origenCentro: [number, number] | null = null
    const marcadorCentro = new maplibregl.Marker({ element: creaMarcadorMover(colorEdicion), draggable: true })
      .setLngLat(centroide())
      .addTo(mapa)

    marcadorCentro.on('dragstart', () => {
      origenCentro = marcadorCentro.getLngLat().toArray() as [number, number]
    })

    marcadorCentro.on('drag', () => {
      if (!origenCentro) return
      const actual = marcadorCentro.getLngLat().toArray() as [number, number]
      const dx = actual[0] - origenCentro[0]
      const dy = actual[1] - origenCentro[1]
      origenCentro = actual
      coordsRef.current = coordsRef.current.map(([lng, lat]) => [lng + dx, lat + dy])
      verticesRef.current.forEach((m, i) => m.setLngLat(coordsRef.current[i]))
      mediosRef.current.forEach((m, i) => m.setLngLat(medioDe(i)))
      actualizarFuente()
    })

    marcadorCentro.on('dragend', () => {
      origenCentro = null
      onCambiarPoligono([...coordsRef.current])
    })

    return () => {
      limpiar()
      marcadorCentro.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editandoVertices, listo])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={contenedorRef} style={{ width: '100%', height: '100%' }} />
      {editandoVertices && (
        <button
          onClick={onCancelarEdicion}
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(28,28,26,0.85)',
            color: 'white',
            border: 'none',
            borderRadius: 20,
            fontSize: 12,
            padding: '6px 14px',
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      )}
    </div>
  )
})
