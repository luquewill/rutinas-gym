import { Clock, Dumbbell, Flame, Trophy } from 'lucide-react'
import { useStore } from '../store'
import { MODULO_LABEL, getEjercicio } from '../lib/catalog'
import { seriesTotales, volumenKg } from '../lib/semana'
import { EspacioAnuncio } from '../components/Ui'

export default function DiaTerminado({ sesionId, onListo }: { sesionId: string; onListo: () => void }) {
  const { sesiones, semana } = useStore()
  const sesion = sesiones.find((s) => s.id === sesionId)
  const dia = semana.dias.find((d) => d.id === sesion?.diaId)
  if (!sesion || !dia) {
    return (
      <div className="p-6 text-center">
        <p>No encontré esta sesión.</p>
        <button className="btn-primary mt-4" onClick={onListo}>Volver</button>
      </div>
    )
  }
  const ids = dia.ejercicios.map((e) => e.ejercicioId)
  const total = dia.ejercicios.reduce((a, e) => a + e.series, 0)
  const hechas = seriesTotales(sesion, ids)
  const min = Math.max(1, Math.round(((sesion.fin ?? Date.now()) - sesion.inicio) / 60000))
  const vol = Math.round(volumenKg(sesion))

  const stats = [
    { icon: Dumbbell, label: 'Series', valor: `${hechas}/${total}` },
    { icon: Clock, label: 'Minutos', valor: String(min) },
    { icon: Flame, label: 'Volumen', valor: vol ? `${vol} kg` : '—' },
  ]

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-10">
      <div className="pt-6 text-center">
        <Trophy className="mx-auto text-accent" size={56} />
        <h1 className="mt-3 text-5xl text-accent">Día terminado</h1>
        <p className="mt-1 text-mute">{dia.modulos.map((m) => MODULO_LABEL[m]).join(' + ')}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map(({ icon: I, label, valor }) => (
          <div key={label} className="card p-3 text-center">
            <I className="mx-auto mb-1 text-accent" size={20} />
            <div className="font-display text-2xl">{valor}</div>
            <div className="text-xs text-mute">{label}</div>
          </div>
        ))}
      </div>
      <div className="card divide-y divide-line">
        {dia.ejercicios.map((pe, i) => {
          const e = getEjercicio(pe.ejercicioId)
          const s = (sesion.series[pe.ejercicioId] ?? []).filter((x) => x.hecha)
          const mejor = s.filter((x) => x.peso).sort((a, b) => (b.peso ?? 0) - (a.peso ?? 0))[0]
          return (
            <div key={pe.ejercicioId + i} className="flex items-center justify-between gap-3 p-3">
              <span className="min-w-0 truncate">{e?.nombre}</span>
              <span className="shrink-0 text-sm text-mute">
                {s.length}/{pe.series}{mejor ? ` · ${mejor.peso} kg${mejor.reps ? ` × ${mejor.reps}` : ''}` : ''}
              </span>
            </div>
          )
        })}
      </div>
      <EspacioAnuncio ubicacion="dia-terminado" />
      <button className="btn-primary w-full !min-h-[56px] text-lg" onClick={onListo}>Listo</button>
    </div>
  )
}
