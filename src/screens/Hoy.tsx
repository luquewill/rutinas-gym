import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Check, History, Minus, Pencil, Plus, Repeat, Settings, SkipForward, Timer } from 'lucide-react'
import { useStore } from '../store'
import type { DiaPlan, Ejercicio, EjercicioPlan, SerieRegistro, SesionRegistro } from '../data/types'
import { DIAS_CORTO, DIAS_LARGO, MODULO_LABEL, MUSCULO_LABEL, getEjercicio } from '../lib/catalog'
import { hoyISO } from '../lib/dates'
import { diaDeHoy, seriesTotales, ultimoPeso } from '../lib/semana'
import { Media } from '../components/Media'
import { FichaEjercicio, ReemplazarHoja } from '../components/Ejercicios'
import { Encabezado, Hoja } from '../components/Ui'

interface Props {
  irA: (v: 'historial' | 'ajustes' | 'semana') => void
  alTerminar: (sesionId: string) => void
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

export default function Hoy({ irA, alTerminar }: Props) {
  const { semana, ajustes, sesiones, guardarSesion, actualizarDia } = useStore()
  const sugerido = diaDeHoy(semana.dias)
  const [diaIdSel, setDiaIdSel] = useState<string | null>(null)
  const dia: DiaPlan | undefined = semana.dias.find((d) => d.id === diaIdSel) ?? sugerido?.dia
  const esHoy = dia ? dia.diaSemana === new Date().getDay() : false

  const fecha = hoyISO()
  const sesionId = dia ? `${fecha}_${dia.id}` : ''
  const guardada = sesiones.find((s) => s.id === sesionId)
  const inicioRef = useRef(Date.now())
  const sesion: SesionRegistro | undefined = dia ? (guardada ?? { id: sesionId, fecha, diaId: dia.id, series: {}, inicio: inicioRef.current }) : undefined

  const [ficha, setFicha] = useState<Ejercicio | null>(null)
  const [reemplazar, setReemplazar] = useState<string | null>(null) // ejercicioId
  const [anotar, setAnotar] = useState<string | null>(null)

  // ---- Temporizador de descanso (basado en hora de fin, sobrevive a pantallas dormidas)
  const [timer, setTimer] = useState<{ fin: number; total: number } | null>(null)
  const [ahora, setAhora] = useState(Date.now())
  const [listoMsg, setListoMsg] = useState(false)
  useEffect(() => {
    if (!timer) return
    const id = setInterval(() => setAhora(Date.now()), 250)
    return () => clearInterval(id)
  }, [timer])
  const restante = timer ? Math.max(0, Math.ceil((timer.fin - ahora) / 1000)) : 0
  useEffect(() => {
    if (timer && restante === 0) {
      if (ajustes.vibracion && 'vibrate' in navigator) navigator.vibrate([400, 150, 400, 150, 600])
      setTimer(null)
      setListoMsg(true)
      const t = setTimeout(() => setListoMsg(false), 4000)
      return () => clearTimeout(t)
    }
  }, [restante, timer, ajustes.vibracion])

  const ids = useMemo(() => dia?.ejercicios.map((e) => e.ejercicioId) ?? [], [dia])
  const totalSeries = dia?.ejercicios.reduce((a, e) => a + e.series, 0) ?? 0
  const hechas = seriesTotales(sesion, ids)
  const pct = totalSeries ? Math.round((hechas / totalSeries) * 100) : 0

  if (!dia || !sesion) {
    return (
      <div>
        <Encabezado titulo="Hoy" />
        <div className="space-y-4 p-4">
          <div className="card p-6 text-center">
            <CalendarDays className="mx-auto mb-3 text-accent" size={36} />
            <p className="font-display text-2xl uppercase">Armá tu rutina</p>
            <p className="mt-1 text-sm text-mute">Elegí los días que entrenás, qué músculos trabajás en cada uno y los ejercicios. O partí de una plantilla.</p>
            <button className="btn-primary mt-4" onClick={() => irA('semana')}>Empezar</button>
          </div>
        </div>
      </div>
    )
  }

  const setSeries = (ej: EjercicioPlan, fn: (arr: SerieRegistro[]) => SerieRegistro[]) => {
    const base = Array.from({ length: ej.series }, (_, i) => sesion.series[ej.ejercicioId]?.[i] ?? { hecha: false })
    void guardarSesion({ ...sesion, series: { ...sesion.series, [ej.ejercicioId]: fn(base) } })
  }

  const alternarSerie = (ej: EjercicioPlan, i: number) => {
    const marcar = !(sesion.series[ej.ejercicioId]?.[i]?.hecha ?? false)
    setSeries(ej, (arr) => arr.map((s, k) => (k === i ? { ...s, hecha: marcar } : s)))
    if (marcar) {
      const seg = ej.descanso || ajustes.descansoDefault
      setListoMsg(false)
      setAhora(Date.now())
      setTimer({ fin: Date.now() + seg * 1000, total: seg })
    }
  }

  const terminar = async () => {
    await guardarSesion({ ...sesion, fin: Date.now() })
    setTimer(null)
    alTerminar(sesion.id)
  }

  const reemplazarEj = reemplazar ? dia.ejercicios.find((e) => e.ejercicioId === reemplazar) : undefined
  const anotarEj = anotar ? dia.ejercicios.find((e) => e.ejercicioId === anotar) : undefined

  return (
    <div className={timer || listoMsg ? 'pb-28' : ''}>
      <Encabezado
        titulo={esHoy ? 'Hoy' : 'Próximo día'}
        subtitulo={`${DIAS_LARGO[dia.diaSemana]} · ${dia.modulos.map((m) => MODULO_LABEL[m]).join(' + ') || 'Sin módulos'}`}
        derecha={
          <>
            <button className="btn-ghost !w-11 !px-0" onClick={() => irA('historial')} aria-label="Historial"><History size={20} /></button>
            <button className="btn-ghost !w-11 !px-0" onClick={() => irA('ajustes')} aria-label="Ajustes"><Settings size={20} /></button>
          </>
        }
      />

      <div className="space-y-4 p-4">
        {semana.dias.length > 1 && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {[...semana.dias].sort((a, b) => a.diaSemana - b.diaSemana).map((d) => (
              <button key={d.id} className={`chip ${d.id === dia.id ? 'chip-on' : ''}`} onClick={() => setDiaIdSel(d.id)}>
                {DIAS_CORTO[d.diaSemana]}
              </button>
            ))}
          </div>
        )}
        {!esHoy && <p className="text-sm text-mute">Hoy no te toca entrenar. Este es tu próximo día; podés hacerlo igual cuando quieras.</p>}

        <div className="card p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="font-display text-xl">Progreso</span>
            <span className="text-sm text-mute">{hechas}/{totalSeries} series · {pct}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {dia.ejercicios.length === 0 && (
          <div className="card p-6 text-center">
            <p className="font-bold">Este día no tiene ejercicios</p>
            <button className="btn-primary mt-3" onClick={() => irA('semana')}>Armar este día</button>
          </div>
        )}

        {dia.ejercicios.map((ej, idx) => {
          const e = getEjercicio(ej.ejercicioId)
          if (!e) return null
          const series = sesion.series[ej.ejercicioId] ?? []
          const ult = ultimoPeso(sesiones, ej.ejercicioId, sesion.id)
          const completo = series.filter((s) => s.hecha).length >= ej.series
          return (
            <article key={ej.ejercicioId + idx} className={`card overflow-hidden ${completo ? 'border-accent/60' : ''}`}>
              <div className="flex gap-3 p-3">
                <button className="shrink-0" onClick={() => setFicha(e)} aria-label={`Ver ficha de ${e.nombre}`}>
                  <Media ejercicio={e} className="h-24 w-28 rounded-xl" />
                </button>
                <div className="min-w-0 flex-1">
                  <button className="block w-full text-left" onClick={() => setFicha(e)}>
                    <h3 className="text-xl leading-tight">{e.nombre}</h3>
                  </button>
                  <p className="mt-0.5 text-xs text-mute">{MUSCULO_LABEL[e.musculoPrincipal]} · <span className="capitalize">{e.equipo}</span></p>
                  <p className="mt-1 text-sm font-bold">{ej.series} × {ej.reps} <span className="font-normal text-mute">· descanso {ej.descanso} s</span></p>
                  {ult && <p className="mt-0.5 text-xs text-accent">Última vez: {ult.peso} kg{ult.reps ? ` × ${ult.reps}` : ''}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 border-t border-line p-3">
                <div className="flex flex-1 flex-wrap gap-2">
                  {Array.from({ length: ej.series }, (_, i) => {
                    const s = series[i]
                    return (
                      <button
                        key={i}
                        onClick={() => alternarSerie(ej, i)}
                        aria-pressed={!!s?.hecha}
                        aria-label={`Serie ${i + 1}${s?.hecha ? ' hecha' : ''}`}
                        className={`flex h-12 min-w-12 flex-col items-center justify-center rounded-xl border px-2 font-display text-xl leading-none transition active:scale-95 ${s?.hecha ? 'border-accent bg-accent text-black' : 'border-line bg-bg text-white'}`}
                      >
                        {s?.hecha ? <Check size={20} strokeWidth={3} /> : i + 1}
                        {s?.hecha && s.peso ? <span className="mt-0.5 font-sans text-[10px] font-bold">{s.peso}kg</span> : null}
                      </button>
                    )
                  })}
                </div>
                <button className="btn-ghost !w-12 !px-0" onClick={() => setAnotar(ej.ejercicioId)} aria-label="Anotar peso y repeticiones"><Pencil size={18} /></button>
                <button className="btn-ghost !w-12 !px-0" onClick={() => setReemplazar(ej.ejercicioId)} aria-label="Reemplazar ejercicio"><Repeat size={18} /></button>
              </div>
            </article>
          )
        })}

        {dia.ejercicios.length > 0 && (
          <button className="btn-primary w-full !min-h-[56px] text-lg" onClick={terminar}>
            <Check size={22} /> {hechas >= totalSeries ? 'Terminar día' : 'Terminar día igual'}
          </button>
        )}
      </div>

      {(timer || listoMsg) && (
        <div className="fixed inset-x-0 bottom-[68px] z-30 px-3">
          <div className="mx-auto flex max-w-lg items-center gap-2 rounded-2xl border border-accent bg-card p-2 shadow-lg shadow-black/60">
            {timer ? (
              <>
                <Timer className="ml-2 shrink-0 text-accent" size={22} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-3xl leading-none">{fmt(restante)}</div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                    <div className="h-full bg-accent" style={{ width: `${(restante / timer.total) * 100}%` }} />
                  </div>
                </div>
                <button className="btn-ghost !w-11 !px-0" onClick={() => setTimer({ ...timer, fin: timer.fin - 15000 })} aria-label="Restar 15 segundos"><Minus size={18} /></button>
                <button className="btn-ghost !w-11 !px-0" onClick={() => setTimer({ fin: timer.fin + 15000, total: timer.total + 15 })} aria-label="Sumar 15 segundos"><Plus size={18} /></button>
                <button className="btn-primary !w-11 !px-0" onClick={() => setTimer(null)} aria-label="Saltar descanso"><SkipForward size={18} /></button>
              </>
            ) : (
              <>
                <Timer className="ml-2 shrink-0 text-accent" size={22} />
                <span className="flex-1 font-display text-2xl">¡Descanso terminado! A la próxima serie</span>
                <button className="btn-ghost !w-11 !px-0" onClick={() => setListoMsg(false)} aria-label="Cerrar aviso"><Check size={18} /></button>
              </>
            )}
          </div>
        </div>
      )}

      {ficha && (
        <FichaEjercicio
          ejercicio={ficha}
          onCerrar={() => setFicha(null)}
          onReemplazar={() => {
            setReemplazar(ficha.id)
            setFicha(null)
          }}
        />
      )}

      {reemplazarEj && getEjercicio(reemplazarEj.ejercicioId) && (
        <ReemplazarHoja
          actual={getEjercicio(reemplazarEj.ejercicioId)!}
          enUso={new Set(dia.ejercicios.map((x) => x.ejercicioId))}
          onCerrar={() => setReemplazar(null)}
          onElegir={(nuevo) => {
            void actualizarDia(dia.id, (d) => ({
              ...d,
              ejercicios: d.ejercicios.map((x) => (x.ejercicioId === reemplazarEj.ejercicioId ? { ejercicioId: nuevo.id, series: nuevo.seriesDefault, reps: nuevo.repsDefault, descanso: nuevo.descansoDefault } : x)),
            }))
            setReemplazar(null)
          }}
        />
      )}

      {anotarEj && getEjercicio(anotarEj.ejercicioId) && (
        <HojaAnotar
          plan={anotarEj}
          ejercicio={getEjercicio(anotarEj.ejercicioId)!}
          series={sesion.series[anotarEj.ejercicioId] ?? []}
          ultimo={ultimoPeso(sesiones, anotarEj.ejercicioId, sesion.id)}
          onCerrar={() => setAnotar(null)}
          onGuardar={(arr) => {
            setSeries(anotarEj, () => arr)
            setAnotar(null)
          }}
        />
      )}
    </div>
  )
}

function HojaAnotar({ plan, ejercicio, series, ultimo, onCerrar, onGuardar }: { plan: EjercicioPlan; ejercicio: Ejercicio; series: SerieRegistro[]; ultimo: { peso: number; reps?: number } | null; onCerrar: () => void; onGuardar: (s: SerieRegistro[]) => void }) {
  const [filas, setFilas] = useState(() =>
    Array.from({ length: plan.series }, (_, i) => ({
      hecha: series[i]?.hecha ?? false,
      peso: series[i]?.peso != null ? String(series[i]!.peso) : '',
      reps: series[i]?.reps != null ? String(series[i]!.reps) : '',
    })),
  )
  const num = (v: string) => (v.trim() === '' || isNaN(Number(v.replace(',', '.'))) ? undefined : Number(v.replace(',', '.')))
  const set = (i: number, k: 'peso' | 'reps', v: string) => setFilas((f) => f.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  return (
    <Hoja titulo={ejercicio.nombre} onCerrar={onCerrar}>
      <p className="mb-3 text-sm text-mute">
        {ultimo ? <>Última vez: <b className="text-accent">{ultimo.peso} kg{ultimo.reps ? ` × ${ultimo.reps}` : ''}</b></> : 'Todavía no anotaste pesos para este ejercicio.'}
      </p>
      <div className="mb-1 grid grid-cols-[2.5rem_1fr_1fr] gap-2 text-xs text-mute">
        <span>Serie</span><span>Peso (kg)</span><span>Reps</span>
      </div>
      <div className="space-y-2">
        {filas.map((f, i) => (
          <div key={i} className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2">
            <span className="font-display text-2xl text-accent">{i + 1}</span>
            <input className="field" inputMode="decimal" placeholder={ultimo ? String(ultimo.peso) : '0'} value={f.peso} onChange={(e) => set(i, 'peso', e.target.value)} aria-label={`Peso serie ${i + 1}`} />
            <input className="field" inputMode="numeric" placeholder={plan.reps} value={f.reps} onChange={(e) => set(i, 'reps', e.target.value)} aria-label={`Repeticiones serie ${i + 1}`} />
          </div>
        ))}
      </div>
      <button
        className="btn-primary mt-4 w-full"
        onClick={() => onGuardar(filas.map((f) => ({ hecha: f.hecha || num(f.peso) !== undefined || num(f.reps) !== undefined, peso: num(f.peso), reps: num(f.reps) })))}
      >
        Guardar
      </button>
    </Hoja>
  )
}
