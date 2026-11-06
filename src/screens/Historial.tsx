import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { MODULO_LABEL, getEjercicio } from '../lib/catalog'
import { fechaLinda } from '../lib/dates'
import { seriesTotales } from '../lib/semana'
import { Encabezado } from '../components/Ui'

interface Punto { fecha: string; peso: number }

function Grafico({ puntos }: { puntos: Punto[] }) {
  const W = 320, H = 150, P = 24
  const pesos = puntos.map((p) => p.peso)
  const min = Math.min(...pesos), max = Math.max(...pesos)
  const rango = max - min || 1
  const x = (i: number) => (puntos.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (puntos.length - 1))
  const y = (v: number) => H - P - ((v - min) / rango) * (H - 2 * P)
  const path = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.peso)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico de progreso de peso">
      <line x1={P} x2={W - P} y1={H - P} y2={H - P} stroke="#2A2A2A" />
      <path d={path} fill="none" stroke="#FF6B00" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {puntos.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.peso)} r="4.5" fill="#FF6B00" />
          {(i === 0 || i === puntos.length - 1 || puntos.length < 6) && (
            <text x={x(i)} y={y(p.peso) - 9} textAnchor="middle" fontSize="11" fill="#fff">{p.peso}</text>
          )}
        </g>
      ))}
      <text x={P} y={H - 6} fontSize="10" fill="#A3A3A3">{fechaLinda(puntos[0].fecha)}</text>
      <text x={W - P} y={H - 6} fontSize="10" fill="#A3A3A3" textAnchor="end">{fechaLinda(puntos[puntos.length - 1].fecha)}</text>
    </svg>
  )
}

export default function Historial({ onVolver }: { onVolver: () => void }) {
  const { sesiones, semana } = useStore()
  const conPeso = useMemo(() => {
    const m = new Map<string, Punto[]>()
    for (const s of [...sesiones].reverse()) {
      for (const [id, series] of Object.entries(s.series)) {
        const pesos = series.filter((x) => x.hecha && x.peso).map((x) => x.peso!)
        if (pesos.length) m.set(id, [...(m.get(id) ?? []), { fecha: s.fecha, peso: Math.max(...pesos) }])
      }
    }
    return m
  }, [sesiones])
  const opciones = [...conPeso.keys()]
  const [sel, setSel] = useState<string>('')
  const actual = sel && conPeso.has(sel) ? sel : opciones[0]

  return (
    <div>
      <Encabezado titulo="Historial" onVolver={onVolver} subtitulo={`${sesiones.length} días entrenados`} />
      <div className="space-y-4 p-4">
        <section className="card p-4">
          <h2 className="mb-2 text-xl">Progreso de peso</h2>
          {opciones.length === 0 ? (
            <p className="text-sm text-mute">Cuando anotes pesos en Hoy, acá vas a ver cómo evolucionan.</p>
          ) : (
            <>
              <select className="field mb-3" value={actual} onChange={(e) => setSel(e.target.value)} aria-label="Elegir ejercicio">
                {opciones.map((id) => (
                  <option key={id} value={id}>{getEjercicio(id)?.nombre ?? id}</option>
                ))}
              </select>
              <Grafico puntos={conPeso.get(actual)!} />
              <p className="mt-1 text-xs text-mute">Mejor peso de cada sesión (kg).</p>
            </>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-xl">Días entrenados</h2>
          {sesiones.length === 0 && <p className="text-sm text-mute">Todavía no hay sesiones. ¡Arrancá con la de hoy!</p>}
          <ul className="space-y-2">
            {sesiones.map((s) => {
              const dia = semana.dias.find((d) => d.id === s.diaId)
              const ids = Object.keys(s.series)
              const hechas = seriesTotales(s, ids)
              return (
                <li key={s.id} className="card flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="font-bold capitalize">{fechaLinda(s.fecha)}</div>
                    <div className="truncate text-sm text-mute">{dia ? dia.modulos.map((m) => MODULO_LABEL[m]).join(' + ') : 'Día de una rutina anterior'}</div>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <div className="font-display text-xl text-accent">{hechas} series</div>
                    <div className="text-xs text-mute">{s.fin ? 'Terminado' : 'Sin terminar'}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
