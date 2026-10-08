import { useEffect, useMemo, useRef, useState } from 'react'
import {
  obtenerCongregacionActual,
  obtenerSectores,
  obtenerTerritorios,
  obtenerPublicadores,
  crearCampana as crearCampanaEnAPI,
  eliminarCampana as eliminarCampanaEnAPI,
  obtenerCampanaActiva,
  crearSector as crearSectorEnAPI,
  actualizarSector as actualizarSectorEnAPI,
  actualizarTerritorio,
  crearTerritorio as crearTerritorioEnAPI,
  asignarTerritorio as asignarTerritorioEnAPI,
  devolverTerritorio as devolverTerritorioEnAPI,
  eliminarTerritorio as eliminarTerritorioEnAPI,
  reordenarSectores as reordenarSectoresEnAPI,
  establecerClave,
} from './api/client'
import type { Congregacion, Sector, Territorio, TipoSector, Campana } from './api/types'
import { AdminLayout } from './layouts/AdminLayout'
import { SectorSidebar } from './features/sectores/SectorSidebar'
import { CrearCampanaModal } from './features/campanas/CrearCampanaModal'
import { CrearSectorModal } from './features/sectores/CrearSectorModal'
import { EditarSectorModal } from './features/sectores/EditarSectorModal'
import { TerritoryMap, type TerritoryMapHandle } from './features/territorios/TerritoryMap'
import { TerritoryPanel } from './features/territorios/TerritoryPanel'
import { SaveToast } from './components/SaveToast'
import { coloresPorSector as construirColoresPorSector } from './utils/sectorColors'

// Id provisional para un territorio que todavía no existe en el
// servidor — en cuanto se crea de verdad, pasa a tener su id real.
const ID_NUEVO = '__nuevo__'

/** El texto que devuelve el servidor, en minúsculas, para reconocer el motivo. */
function motivoBruto(error: unknown): string {
  return ((error as { message?: string } | null)?.message ?? String(error)).toLowerCase()
}

/** Explica el motivo real de un fallo, en vez de culpar siempre a la conexión. */
function motivoDelError(error: unknown): string {
  const texto = motivoBruto(error)
  if (texto.includes('suscripcion_caducada')) {
    return 'La suscripción de la congregación ha caducado. Un administrador debe renovarla desde la app Wkit.'
  }
  if (texto.includes('clave no valida') || texto.includes('ya no tiene permiso')) {
    return 'Tu acceso al panel ha caducado o ya no tiene permiso. Pídele al anciano un enlace nuevo.'
  }
  return 'Comprueba tu conexión e inténtalo de nuevo.'
}

export default function App() {
  const [estado, setEstado] = useState<
    'cargando' | 'sin_clave' | 'clave_invalida' | 'suscripcion_caducada' | 'sin_conexion' | 'listo'
  >('cargando')
  const [congregacion, setCongregacion] = useState<Congregacion | null>(null)
  const [sectores, setSectores] = useState<Sector[]>([])
  const [territorios, setTerritorios] = useState<Territorio[]>([])
  const [publicadores, setPublicadores] = useState<{ id: string; nombre: string }[]>([])
  const [sectorSeleccionadoId, setSectorSeleccionadoId] = useState<string | null>(null)
  const [territorioSeleccionadoId, setTerritorioSeleccionadoId] = useState<string | null>(null)
  const [mostrandoCrearSector, setMostrandoCrearSector] = useState(false)
  const [campana, setCampana] = useState<Campana | null>(null)
  const [mostrandoCrearCampana, setMostrandoCrearCampana] = useState(false)
  const [sectorEditando, setSectorEditando] = useState<Sector | null>(null)
  const [editandoVertices, setEditandoVertices] = useState(false)

  // Mientras se está creando un territorio nuevo, vive aquí — todavía
  // no está en la lista de "territorios" de verdad.
  const [nuevoTerritorioBase, setNuevoTerritorioBase] = useState<Territorio | null>(null)

  // Para poder preguntarle al mapa, al momento, dónde está mirando
  // ahora mismo — así un territorio nuevo nace donde estés, no siempre
  // en el mismo punto fijo.
  const mapaRef = useRef<TerritoryMapHandle>(null)

  // Único lugar donde vive el territorio con cambios pendientes (número,
  // sector o polígono) mientras no se pulse "Guardar cambios".
  const [borrador, setBorrador] = useState<Territorio | null>(null)

  const [ultimoGuardado, setUltimoGuardado] = useState<{ anterior: Territorio; actual: Territorio } | null>(
    null
  )

  useEffect(() => {
    const clave = new URLSearchParams(window.location.search).get('clave')
    if (!clave) {
      setEstado('sin_clave')
      return
    }
    establecerClave(clave)
    obtenerCongregacionActual()
      .then((c) => {
        setCongregacion(c)
        setEstado('listo')
        obtenerSectores(c.id).then(setSectores)
        obtenerTerritorios().then(setTerritorios)
        obtenerPublicadores().then(setPublicadores)
        obtenerCampanaActiva().then(setCampana).catch(() => {})
      })
      .catch((error) => {
        const texto = motivoBruto(error)
        if (texto.includes('suscripcion_caducada')) setEstado('suscripcion_caducada')
        else if (texto.includes('clave no valida') || texto.includes('ya no tiene permiso')) setEstado('clave_invalida')
        else setEstado('sin_conexion')
      })
  }, [])

  // Si la campaña se crea, se borra o avanza desde la app (o desde otro
  // ordenador), al volver a esta pestaña se pone al día.
  useEffect(() => {
    if (estado !== 'listo') return
    const alVolver = () => {
      obtenerCampanaActiva().then(setCampana).catch(() => {})
    }
    window.addEventListener('focus', alVolver)
    return () => window.removeEventListener('focus', alVolver)
  }, [estado])

  const coloresPorSector = useMemo(() => construirColoresPorSector(sectores), [sectores])

  const territoriosVisibles = sectorSeleccionadoId
    ? territorios.filter((t) => t.sectorId === sectorSeleccionadoId)
    : territorios

  const modoCreacion = territorioSeleccionadoId === ID_NUEVO

  const territorioSeleccionado = modoCreacion
    ? nuevoTerritorioBase
    : territorios.find((t) => t.id === territorioSeleccionadoId) ?? null

  // El borrador sigue siempre al territorio seleccionado (real o, si
  // estamos creando uno, al provisional).
  useEffect(() => {
    setBorrador(territorioSeleccionado)
    if (!modoCreacion) setEditandoVertices(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [territorioSeleccionado])

  function actualizarBorrador(cambios: Partial<Territorio>) {
    setBorrador((prev) => (prev ? { ...prev, ...cambios } : prev))
  }

  function cancelarEdicionVertices() {
    setEditandoVertices(false)
    if (territorioSeleccionado) setBorrador({ ...territorioSeleccionado })
  }

  // Nace como un cuadradito pequeño junto a los territorios que ya haya
  // en el sector (o en un punto por defecto si todavía no hay
  // ninguno) — y se deja arrastrando desde el primer momento, con el
  // mismo editor de siempre.
  function iniciarCrearTerritorio() {
    if (!sectorSeleccionadoId) return

    const territoriosDelSector = territorios.filter((t) => t.sectorId === sectorSeleccionadoId)
    // Prioridad: un territorio que ya exista en este sector: si no,
    // donde esté mirando el mapa ahora mismo; si tampoco, Priego, como
    // último recurso (no debería llegar a usarse nunca en la práctica).
    // Prioridad: donde esté mirando el mapa ahora mismo, siempre —
    // nunca "cerca de otro territorio del sector" aunque exista, 
    // porque si te has movido a propósito a otra zona, es ahí donde
    // quieres que nazca, no donde ya hay otros.
    const centro =
      mapaRef.current?.obtenerCentro() ??
      territoriosDelSector[0]?.poligono[0] ??
      ([-4.1975, 37.4392] as [number, number])
    const [lng, lat] = centro
    const lado = 0.0015

    const base: Territorio = {
      id: ID_NUEVO,
      sectorId: sectorSeleccionadoId,
      numero: '',
      estado: 'disponible',
      poligono: [
        [lng - lado, lat + lado],
        [lng + lado, lat + lado],
        [lng + lado, lat - lado],
        [lng - lado, lat - lado],
      ],
      enCampana: false,
    }

    setNuevoTerritorioBase(base)
    setTerritorioSeleccionadoId(ID_NUEVO)
    // El modo edición se activa aparte (ver el useEffect de abajo), una
    // vez que "borrador" ya se ha asentado con este territorio nuevo —
    // si se activa en el mismo instante que arriba, el editor de puntos
    // se dispara antes de tener territorio que dibujar, y no sale nada.
  }

  useEffect(() => {
    if (nuevoTerritorioBase) {
      setEditandoVertices(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nuevoTerritorioBase])

  async function guardarTerritorio() {
    if (!borrador) return

    if (modoCreacion) {
      try {
        const creado = await crearTerritorioEnAPI({
          sectorId: borrador.sectorId,
          numero: borrador.numero,
          poligono: borrador.poligono,
        })
        setTerritorios((prev) => [...prev, creado])
        setNuevoTerritorioBase(null)
        setTerritorioSeleccionadoId(creado.id)
        setEditandoVertices(false)
      } catch (error) {
        console.error('Fallo al crear el territorio:', error)
        const detalle = error instanceof Error ? error.message : String(error)
        alert(`No se pudo crear el territorio.\n\n${detalle}`)
      }
      return
    }

    const anterior = territorios.find((t) => t.id === borrador.id)
    if (!anterior) return
    try {
      const actualizado = await actualizarTerritorio(borrador.id, {
        numero: borrador.numero,
        sectorId: borrador.sectorId,
        poligono: borrador.poligono,
      })
      setTerritorios((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)))
      setUltimoGuardado({ anterior, actual: actualizado })
      setEditandoVertices(false)
    } catch (error) {
      console.error(error)
      alert(`No se pudo guardar.\n\n${motivoDelError(error)}`)
    }
  }

  async function asignarTerritorioAPublicador(publicadorId: string) {
    if (!territorioSeleccionado || modoCreacion) return
    try {
      await asignarTerritorioEnAPI(territorioSeleccionado.id, publicadorId)
      obtenerTerritorios().then(setTerritorios)
    } catch (error) {
      console.error(error)
      alert(`No se pudo asignar el territorio.\n\n${motivoDelError(error)}`)
    }
  }

  async function devolverElTerritorio() {
    if (!territorioSeleccionado || modoCreacion) return
    try {
      await devolverTerritorioEnAPI(territorioSeleccionado.id)
      obtenerTerritorios().then(setTerritorios)
    } catch (error) {
      console.error(error)
      alert(`No se pudo devolver el territorio.\n\n${motivoDelError(error)}`)
    }
  }

  async function eliminarTerritorioSeleccionado() {
    if (!territorioSeleccionado || modoCreacion) return
    try {
      await eliminarTerritorioEnAPI(territorioSeleccionado.id)
      setTerritorios((prev) => prev.filter((t) => t.id !== territorioSeleccionado.id))
      setTerritorioSeleccionadoId(null)
    } catch (error) {
      console.error(error)
      alert(`No se pudo eliminar el territorio.\n\n${motivoDelError(error)}`)
    }
  }

  function deshacerGuardado() {
    if (!ultimoGuardado) return
    // TODO: esto solo deshace en la pantalla; cuando haya base de datos
    // real habrá que mandar también el "anterior" de vuelta al servidor.
    setTerritorios((prev) =>
      prev.map((t) => (t.id === ultimoGuardado.anterior.id ? ultimoGuardado.anterior : t))
    )
    setBorrador(ultimoGuardado.anterior)
    setUltimoGuardado(null)
  }

  function mensajeDe(error: unknown): string {
    return (error as { message?: string } | null)?.message ?? String(error)
  }

  async function crearCampana(datos: { nombre: string; inicio: string; fin: string }) {
    try {
      await crearCampanaEnAPI(datos)
      setCampana(await obtenerCampanaActiva())
      setMostrandoCrearCampana(false)
    } catch (error) {
      console.error('Fallo al crear la campaña:', error)
      const detalle = mensajeDe(error)
      alert(
        detalle.includes('ya hay una campaña')
          ? 'Ya hay una campaña activa. Elimínala antes de crear otra.'
          : `No se pudo crear la campaña.\n\n${detalle}`
      )
      // Si ya había una (por ejemplo, creada desde la app), la enseñamos.
      obtenerCampanaActiva().then(setCampana).catch(() => {})
    }
  }

  async function eliminarLaCampana() {
    if (!campana) return
    try {
      await eliminarCampanaEnAPI(campana.id)
      setCampana(null)
    } catch (error) {
      console.error('Fallo al eliminar la campaña:', error)
      alert(`No se pudo eliminar la campaña.\n\n${mensajeDe(error)}`)
      obtenerCampanaActiva().then(setCampana).catch(() => {})
    }
  }

  async function reordenarSectores(nuevoOrden: string[]) {
    // Se actualiza en pantalla al momento, sin esperar al servidor —
    // si falla el guardado, lo deshacemos y avisamos.
    const anteriores = sectores
    const reordenados = nuevoOrden
      .map((id) => sectores.find((s) => s.id === id))
      .filter((s): s is Sector => !!s)
    setSectores(reordenados)
    try {
      await reordenarSectoresEnAPI(nuevoOrden)
    } catch (error) {
      console.error(error)
      setSectores(anteriores)
      alert(`No se pudo guardar el nuevo orden.\n\n${motivoDelError(error)}`)
    }
  }

  async function crearSector(datos: { nombre: string; tipo: TipoSector; color: string }) {
    try {
      const sector = await crearSectorEnAPI(datos)
      setSectores((prev) => [...prev, sector])
      setMostrandoCrearSector(false)
    } catch (error) {
      console.error(error)
      alert(`No se pudo crear el sector.\n\n${motivoDelError(error)}`)
    }
  }

  async function guardarSector(id: string, datos: { nombre: string; tipo: TipoSector; color: string }) {
    try {
      const actualizado = await actualizarSectorEnAPI(id, datos)
      setSectores((prev) => prev.map((s) => (s.id === actualizado.id ? actualizado : s)))
      setSectorEditando(null)
    } catch (error) {
      console.error(error)
      alert(`No se pudo guardar el sector.\n\n${motivoDelError(error)}`)
    }
  }

  const sectorDelUltimoGuardado = ultimoGuardado
    ? sectores.find((s) => s.id === ultimoGuardado.actual.sectorId)
    : null

  if (estado === 'cargando') {
    return <div style={{ padding: 32, color: 'var(--color-text-secondary)' }}>Cargando…</div>
  }

  if (estado === 'sin_clave') {
    return (
      <div style={{ padding: 32, maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <h2>Falta la clave de acceso</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Pídele al anciano que te genere un enlace de acceso al panel desde la app Wkit — este panel no
          se puede abrir directamente sin él.
        </p>
      </div>
    )
  }

  if (estado === 'suscripcion_caducada') {
    return (
      <div style={{ padding: 32, maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <h2>La suscripción de la congregación ha caducado</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Mientras no se renueve, el panel no se puede usar. Pídele a un administrador que la renueve
          desde la app Wkit (Ajustes → Suscripción de la congregación).
        </p>
      </div>
    )
  }

  if (estado === 'sin_conexion') {
    return (
      <div style={{ padding: 32, maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <h2>No se pudo conectar</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Comprueba tu conexión a internet y vuelve a intentarlo.
        </p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    )
  }

  if (estado === 'clave_invalida') {
    return (
      <div style={{ padding: 32, maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <h2>Esta clave no es válida o ha caducado</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Pídele al anciano que te genere una nueva desde la app Wkit.
        </p>
      </div>
    )
  }

  return (
    <>
      <AdminLayout
        titulo={congregacion ? `Territorios — ${congregacion.nombre}` : 'Territorios'}
        sidebar={
          <SectorSidebar
            sectores={sectores}
            territorios={territorios}
            sectorSeleccionadoId={sectorSeleccionadoId}
            territorioSeleccionadoId={territorioSeleccionadoId}
            coloresPorSector={coloresPorSector}
            onSeleccionarSector={setSectorSeleccionadoId}
            onSeleccionarTerritorio={setTerritorioSeleccionadoId}
            onCrearSector={() => setMostrandoCrearSector(true)}
            onEditarSector={setSectorEditando}
            onCrearTerritorio={iniciarCrearTerritorio}
            onReordenar={reordenarSectores}
            campana={campana}
            onCrearCampana={() => setMostrandoCrearCampana(true)}
            onEliminarCampana={eliminarLaCampana}
          />
        }
        mapa={
          <TerritoryMap
            ref={mapaRef}
            territorios={modoCreacion && borrador ? [...territoriosVisibles, borrador] : territoriosVisibles}
            territorioSeleccionadoId={territorioSeleccionadoId}
            coloresPorSector={coloresPorSector}
            onSeleccionar={setTerritorioSeleccionadoId}
            borrador={borrador}
            editandoVertices={editandoVertices}
            colorEdicion={borrador ? coloresPorSector[borrador.sectorId] ?? '#0F6E56' : '#0F6E56'}
            onCambiarPoligono={(coords) => actualizarBorrador({ poligono: coords })}
            onCancelarEdicion={cancelarEdicionVertices}
          />
        }
        panel={
          <TerritoryPanel
            territorioOriginal={territorioSeleccionado}
            borrador={borrador}
            sectores={sectores}
            publicadores={publicadores}
            editandoVertices={editandoVertices}
            modoCreacion={modoCreacion}
            onCambiarCampo={actualizarBorrador}
            onIniciarEdicionVertices={() => setEditandoVertices(true)}
            onTerminarEdicionVertices={() => setEditandoVertices(false)}
            onGuardar={guardarTerritorio}
            onAsignar={asignarTerritorioAPublicador}
            onDevolver={devolverElTerritorio}
            onEliminar={eliminarTerritorioSeleccionado}
          />
        }
      />

      {mostrandoCrearSector && congregacion && (
        <CrearSectorModal
          coloresUsados={sectores.map((s) => s.color)}
          onCrear={crearSector}
          onCerrar={() => setMostrandoCrearSector(false)}
        />
      )}

      {mostrandoCrearCampana && (
        <CrearCampanaModal onCrear={crearCampana} onCerrar={() => setMostrandoCrearCampana(false)} />
      )}

      {sectorEditando && (
        <EditarSectorModal
          sector={sectorEditando}
          onGuardar={guardarSector}
          onCerrar={() => setSectorEditando(null)}
        />
      )}

      {ultimoGuardado && (
        <SaveToast
          numero={ultimoGuardado.actual.numero}
          sectorNombre={sectorDelUltimoGuardado?.nombre ?? ''}
          onCancelar={deshacerGuardado}
          onOk={() => setUltimoGuardado(null)}
        />
      )}
    </>
  )
}
