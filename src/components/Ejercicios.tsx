import { useMemo, useState } from 'react'
import { Plus, Repeat, Search } from 'lucide-react'
import type { Ejercicio, Modulo, Musculo } from '../data/types'
import { BIBLIOTECA, EQUIPOS, MODULOS, MODULO_LABEL, MUSCULOS, MUSCULO_LABEL, buscarEjercicios, musculosDeModulo } from '../lib/catalog'
import { alternativas } from '../lib/routine'
import { Media } from './Media'
import { Hoja } from './Ui'

/** Ficha: video grande, 2-3 claves de técnica y acciones. */
export function FichaEjercicio({ ejercicio, onCerrar, onReemplazar }: { ejercicio: Ejercicio; onCerrar: () => void; onReemplazar?: () => void }) {
  return (
    <Hoja titulo={ejercicio.nombre} onCerrar={onCerrar}>
      <Media ejercicio={ejercicio} grande className="aspect-video w-full rounded-2xl" />
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-accent/15 px-3 py-1 font-bold text-accent">{MUSCULO_LABEL[ejercicio.musculoPrincipal]}</span>
        {ejercicio.musculosSecundarios.map((m) => (
          <span key={m} className="rounded-full border border-line px-3 py-1 text-mute">{MUSCULO_LABEL[m]}</span>
        ))}
        <span className="rounded-full border border-line px-3 py-1 capitalize text-mute">{ejercicio.equipo}</span>
        <span className="rounded-full border border-line px-3 py-1 text-mute">{ejercicio.tipo === 'compuesto' ? 'Compuesto' : 'Aislamiento'}</span>
        {ejercicio.unilateral && <span className="rounded-full border border-line px-3 py-1 text-mute">Unilateral</span>}
      </div>
      <h3 className="mb-2 mt-4 text-lg text-accent">Claves de técnica</h3>
      <ol className="space-y-2">
        {ejercicio.tecnica.map((t, i) => (
          <li key={i} className="flex gap-3 rounded-xl border border-line bg-card p-3 text-sm">
            <span className="font-display text-xl leading-none text-accent">{i + 1}</span>
            <span>{t}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-mute">
        Por defecto: {ejercicio.seriesDefault} × {ejercicio.repsDefault} · descanso {ejercicio.descansoDefault} s
      </p>
      {onReemplazar && (
        <button className="btn-ghost mt-4 w-full" onClick={onReemplazar}>
          <Repeat size={18} /> Reemplazar
        </button>
      )}
    </Hoja>
  )
}

/** Alternativas del mismo músculo, primero las del mismo equipo. */
export function ReemplazarHoja({ actual, enUso, onElegir, onCerrar }: { actual: Ejercicio; enUso: Set<string>; onElegir: (e: Ejercicio) => void; onCerrar: () => void }) {
  const lista = useMemo(() => alternativas(actual, BIBLIOTECA, enUso), [actual, enUso])
  return (
    <Hoja titulo="Reemplazar" onCerrar={onCerrar}>
      <p className="mb-3 text-sm text-mute">
        Alternativas para <b className="text-white">{actual.nombre}</b> ({MUSCULO_LABEL[actual.musculoPrincipal]}). Primero las de {actual.equipo}.
      </p>
      {lista.length === 0 && <p className="text-mute">No hay alternativas disponibles.</p>}
      <ul className="space-y-2">
        {lista.map((e) => (
          <li key={e.id}>
            <button className="card flex min-h-[64px] w-full items-center gap-3 p-2 text-left active:scale-[0.98]" onClick={() => onElegir(e)}>
              <Media ejercicio={e} className="h-12 w-16 shrink-0 rounded-lg" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{e.nombre}</span>
                <span className="block text-xs capitalize text-mute">{e.equipo} · {e.tipo}</span>
              </span>
              {e.equipo === actual.equipo && <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">Mismo equipo</span>}
            </button>
          </li>
        ))}
      </ul>
    </Hoja>
  )
}

interface ListaProps {
  /** Si se pasa, el botón de cada tarjeta dice "Agregar" y llama a esto. */
  onAgregar?: (e: Ejercicio) => void
  etiquetaAgregar?: string
  moduloInicial?: Modulo | ''
  /** Ids ya agregados (se marcan). */
  agregados?: Set<string>
  onVer: (e: Ejercicio) => void
}

export function BibliotecaLista({ onAgregar, etiquetaAgregar = 'Agregar', moduloInicial = '', agregados, onVer }: ListaProps) {
  const [texto, setTexto] = useState('')
  const [modulo, setModulo] = useState<Modulo | ''>(moduloInicial)
  const [musculo, setMusculo] = useState<Musculo | ''>('')
  const [equipo, setEquipo] = useState('')

  const musculosOpc = modulo ? musculosDeModulo(modulo) : MUSCULOS
  const lista = useMemo(() => buscarEjercicios(BIBLIOTECA, { texto, modulo, musculo, equipo }), [texto, modulo, musculo, equipo])

  return (
    <div>
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
        <input className="field !pl-10" type="search" placeholder="Buscar ejercicio (sin tildes también)" value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Buscar ejercicio" />
      </div>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
        <button className={`chip ${modulo === '' ? 'chip-on' : ''}`} onClick={() => { setModulo(''); setMusculo('') }}>Todos</button>
        {MODULOS.map((m) => (
          <button key={m} className={`chip ${modulo === m ? 'chip-on' : ''}`} onClick={() => { setModulo(m); setMusculo('') }}>
            {MODULO_LABEL[m]}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <select className="field" value={musculo} onChange={(e) => setMusculo(e.target.value as Musculo | '')} aria-label="Filtrar por músculo">
          <option value="">Todos los músculos</option>
          {musculosOpc.map((m) => (
            <option key={m} value={m}>{MUSCULO_LABEL[m]}</option>
          ))}
        </select>
        <select className="field" value={equipo} onChange={(e) => setEquipo(e.target.value)} aria-label="Filtrar por equipo">
          <option value="">Todo el equipo</option>
          {EQUIPOS.map((q) => (
            <option key={q} value={q}>{q.charAt(0).toUpperCase() + q.slice(1)}</option>
          ))}
        </select>
      </div>
      <p className="my-3 text-sm text-mute">{lista.length} ejercicios</p>
      <ul className="space-y-2">
        {lista.map((e) => {
          const ya = agregados?.has(e.id)
          return (
            <li key={e.id} className="card flex items-center gap-3 p-2">
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onVer(e)} aria-label={`Ver ${e.nombre}`}>
                <Media ejercicio={e} className="h-14 w-20 shrink-0 rounded-lg" />
                <span className="min-w-0">
                  <span className="block truncate font-bold">{e.nombre}</span>
                  <span className="block truncate text-xs text-mute">
                    {MUSCULO_LABEL[e.musculoPrincipal]} · <span className="capitalize">{e.equipo}</span>
                  </span>
                </span>
              </button>
              {onAgregar && (
                <button className={ya ? 'btn-ghost !px-3 text-mute' : 'btn-primary !px-3'} onClick={() => onAgregar(e)} aria-label={`${etiquetaAgregar} ${e.nombre}`}>
                  <Plus size={18} /> {ya ? 'Otra vez' : etiquetaAgregar}
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
