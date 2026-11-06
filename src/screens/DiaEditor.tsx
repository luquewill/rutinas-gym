import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Dices, Hand, Repeat, Sparkles, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import type { Ejercicio, EjercicioPlan, Modulo } from '../data/types'
import { BIBLIOTECA, DIAS_LARGO, MODULOS, MODULO_LABEL, MUSCULO_LABEL, getEjercicio } from '../lib/catalog'
import { alternarModulo, ejerciciosUsadosEnSemana, moverItem, planDesdeEjercicio, recomendarEjercicios } from '../lib/routine'
import { Silueta } from '../components/Silueta'
import { Media } from '../components/Media'
import { BibliotecaLista, FichaEjercicio, ReemplazarHoja } from '../components/Ejercicios'
import { Aviso, Encabezado, Hoja } from '../components/Ui'

interface Props {
  diaId: string
  pedirCambio?: boolean
  onVolver: () => void
}

export default function DiaEditor({ diaId, pedirCambio, onVolver }: Props) {
  const { semana, actualizarDia } = useStore()
  const dia = semana.dias.find((d) => d.id === diaId)
  const [error, setError] = useState('')
  const [confirmarCambio, setConfirmarCambio] = useState(!!pedirCambio)
  const [ficha, setFicha] = useState<Ejercicio | null>(null)
  const [reemplazar, setReemplazar] = useState<number | null>(null)
  const [eligiendo, setEligiendo] = useState(false)

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 5000)
    return () => clearTimeout(t)
  }, [error])

  if (!dia) return null

  const toggle = (m: Modulo) => {
    const r = alternarModulo(dia.modulos, m)
    setError(r.error ?? '')
    if (!r.error) void actualizarDia(dia.id, (d) => ({ ...d, modulos: r.modulos }))
  }

  const recomendar = () => {
    const lista = recomendarEjercicios({
      modulos: dia.modulos,
      biblioteca: BIBLIOTECA,
      excluir: ejerciciosUsadosEnSemana(semana.dias, dia.id),
    })
    void actualizarDia(dia.id, (d) => ({ ...d, ejercicios: lista.map(planDesdeEjercicio) }))
  }

  const cambiarEj = (i: number, patch: Partial<EjercicioPlan>) =>
    void actualizarDia(dia.id, (d) => ({ ...d, ejercicios: d.ejercicios.map((e, k) => (k === i ? { ...e, ...patch } : e)) }))

  const reemplazarEj = reemplazar !== null ? dia.ejercicios[reemplazar] : undefined
  const sinModulos = dia.modulos.length === 0
  const hayLista = dia.ejercicios.length > 0

  return (
    <div>
      <Encabezado
        titulo={DIAS_LARGO[dia.diaSemana]}
        subtitulo={dia.modulos.map((m) => MODULO_LABEL[m]).join(' + ') || 'Elegí qué entrenar'}
        onVolver={onVolver}
        derecha={<button className="btn-ghost !px-3 text-sm" onClick={() => setConfirmarCambio(true)}>Cambiar este día</button>}
      />
      <div className="space-y-5 p-4 pb-10">
        <section>
          <h2 className="mb-2 text-xl">1 · Zonas del cuerpo</h2>
          <p className="mb-2 text-sm text-mute">Tocá la silueta o los botones. Máximo 2 módulos por día; Abdominales es un complemento y no suma.</p>
          <div className="card p-3"><Silueta seleccion={dia.modulos} onToggle={toggle} /></div>
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            {MODULOS.map((m) => (
              <button key={m} className={`chip ${dia.modulos.includes(m) ? 'chip-on' : ''}`} aria-pressed={dia.modulos.includes(m)} onClick={() => toggle(m)}>
                {MODULO_LABEL[m]}
              </button>
            ))}
          </div>
          {error && <div className="mt-3"><Aviso tipo="error">{error}</Aviso></div>}
        </section>

        <section>
          <h2 className="mb-2 text-xl">2 · Ejercicios</h2>
          {sinModulos ? (
            <Aviso>Elegí al menos un módulo para armar los ejercicios.</Aviso>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-primary" onClick={recomendar}>
                {hayLista ? <Dices size={18} /> : <Sparkles size={18} />} {hayLista ? 'Otra combinación' : 'Recomendame'}
              </button>
              <button className="btn-ghost" onClick={() => setEligiendo(true)}><Hand size={18} /> Elijo yo</button>
            </div>
          )}

          {hayLista && (
            <ul className="mt-3 space-y-3">
              {dia.ejercicios.map((pe, i) => {
                const e = getEjercicio(pe.ejercicioId)
                if (!e) return null
                return (
                  <li key={pe.ejercicioId + i} className="card p-3">
                    <div className="flex gap-3">
                      <button className="shrink-0" onClick={() => setFicha(e)} aria-label={`Ver ${e.nombre}`}><Media ejercicio={e} className="h-16 w-20 rounded-lg" /></button>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg leading-tight">{e.nombre}</h3>
                        <p className="text-xs text-mute">{MUSCULO_LABEL[e.musculoPrincipal]} · <span className="capitalize">{e.equipo}</span></p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button className="btn-ghost !min-h-[44px] !w-11 !px-0" disabled={i === 0} onClick={() => void actualizarDia(dia.id, (d) => ({ ...d, ejercicios: moverItem(d.ejercicios, i, i - 1) }))} aria-label="Subir"><ArrowUp size={18} /></button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <label className="text-xs text-mute">Series
                        <input className="field mt-1 text-white" inputMode="numeric" value={pe.series} onChange={(ev) => cambiarEj(i, { series: Math.max(1, Math.min(10, Number(ev.target.value.replace(/\D/g, '')) || 1)) })} />
                      </label>
                      <label className="text-xs text-mute">Repeticiones
                        <input className="field mt-1 text-white" value={pe.reps} onChange={(ev) => cambiarEj(i, { reps: ev.target.value })} />
                      </label>
                      <label className="text-xs text-mute">Descanso (s)
                        <input className="field mt-1 text-white" inputMode="numeric" value={pe.descanso} onChange={(ev) => cambiarEj(i, { descanso: Number(ev.target.value.replace(/\D/g, '')) || 0 })} />
                      </label>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <button className="btn-ghost text-sm" onClick={() => setReemplazar(i)}><Repeat size={16} /> Reemplazar</button>
                      <button className="btn-ghost text-sm" disabled={i === dia.ejercicios.length - 1} onClick={() => void actualizarDia(dia.id, (d) => ({ ...d, ejercicios: moverItem(d.ejercicios, i, i + 1) }))}><ArrowDown size={16} /> Bajar</button>
                      <button className="btn-ghost text-sm text-accent" onClick={() => void actualizarDia(dia.id, (d) => ({ ...d, ejercicios: d.ejercicios.filter((_, k) => k !== i) }))}><Trash2 size={16} /> Sacar</button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {hayLista && (
            <button className="btn-ghost mt-3 w-full" onClick={() => setEligiendo(true)}><Hand size={18} /> Agregar ejercicio de la biblioteca</button>
          )}
        </section>
      </div>

      {confirmarCambio && (
        <Hoja titulo="Cambiar este día" onCerrar={() => setConfirmarCambio(false)}>
          <p className="mb-4 text-mute">Se borran los módulos y ejercicios del {DIAS_LARGO[dia.diaSemana]} para que armes uno nuevo. El resto de la semana no se toca.</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => setConfirmarCambio(false)}>Cancelar</button>
            <button
              className="btn-primary"
              onClick={() => {
                void actualizarDia(dia.id, (d) => ({ ...d, modulos: [], ejercicios: [] }))
                setConfirmarCambio(false)
              }}
            >
              Reconfigurar
            </button>
          </div>
        </Hoja>
      )}

      {eligiendo && (
        <Hoja titulo="Elijo yo" onCerrar={() => setEligiendo(false)}>
          <BibliotecaLista
            moduloInicial={dia.modulos.find((m) => m !== 'abdominales') ?? dia.modulos[0] ?? ''}
            agregados={new Set(dia.ejercicios.map((e) => e.ejercicioId))}
            onVer={setFicha}
            onAgregar={(e) => void actualizarDia(dia.id, (d) => ({ ...d, ejercicios: [...d.ejercicios, planDesdeEjercicio(e)] }))}
          />
        </Hoja>
      )}

      {ficha && <FichaEjercicio ejercicio={ficha} onCerrar={() => setFicha(null)} />}

      {reemplazarEj && getEjercicio(reemplazarEj.ejercicioId) && (
        <ReemplazarHoja
          actual={getEjercicio(reemplazarEj.ejercicioId)!}
          enUso={new Set(dia.ejercicios.map((e) => e.ejercicioId))}
          onCerrar={() => setReemplazar(null)}
          onElegir={(nuevo) => {
            cambiarEj(reemplazar!, planDesdeEjercicio(nuevo))
            setReemplazar(null)
          }}
        />
      )}
    </div>
  )
}
