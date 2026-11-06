import { useState } from 'react'
import { CheckCircle2, ChevronRight, Info, Pencil, RefreshCw } from 'lucide-react'
import { useStore } from '../store'
import { PLANTILLAS, construirSemana, type PlantillaId } from '../data/templates'
import { DIAS_LARGO, MODULO_LABEL } from '../lib/catalog'
import { avisosSemana, crearRng } from '../lib/routine'
import { DiasSelector } from '../components/DiasSelector'
import { Aviso, Encabezado, Hoja } from '../components/Ui'

export default function ArmarSemana({ abrirDia }: { abrirDia: (diaId: string, pedirCambio?: boolean) => void }) {
  const { semana, setSemana } = useStore()
  const [pendiente, setPendiente] = useState<PlantillaId | null>(null)
  const avisos = semana.dias.some((d) => d.modulos.length > 0) ? avisosSemana(semana.dias) : []
  const dias = [...semana.dias].sort((a, b) => a.diaSemana - b.diaSemana)

  const aplicar = (id: PlantillaId) => {
    const actuales = semana.dias.map((d) => d.diaSemana)
    const info = PLANTILLAS.find((p) => p.id === id)!
    // "Desde cero" conserva los días ya elegidos; las demás plantillas los usan si coincide la cantidad.
    const dias = id === 'vacia' ? actuales : actuales.length === info.dias ? actuales : undefined
    void setSemana(construirSemana(id, crearRng(Date.now()), dias))
    setPendiente(null)
  }

  return (
    <div>
      <Encabezado titulo="Armar semana" subtitulo="Elegí días, plantilla y ejercicios" />
      <div className="space-y-6 p-4 pb-8">
        <section className="space-y-3">
          <h2 className="text-xl">Días de entrenamiento</h2>
          <DiasSelector />
        </section>

        <section className="space-y-2">
          <h2 className="text-xl">Plantillas (opcional)</h2>
          {PLANTILLAS.map((p) => {
            const activa = semana.plantilla === p.id
            return (
              <button key={p.id} onClick={() => setPendiente(p.id)} className={`card flex min-h-[64px] w-full items-center gap-3 p-3 text-left active:scale-[0.98] ${activa ? 'border-accent' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-display text-xl">
                    {p.nombre} {activa && <CheckCircle2 size={16} className="text-accent" />}
                  </div>
                  <div className="text-xs text-mute">{p.descripcion}</div>
                </div>
                <ChevronRight size={18} className="shrink-0 text-mute" />
              </button>
            )
          })}
        </section>

        {avisos.length > 0 && (
          <section className="space-y-2" aria-label="Avisos">
            {avisos.map((a, i) => (
              <div key={i} className="flex gap-2 rounded-xl border border-line bg-card px-3 py-2 text-sm text-mute">
                <Info size={16} className="mt-0.5 shrink-0 text-accent" /> <span>{a}</span>
              </div>
            ))}
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-xl">Tu semana</h2>
          {dias.length === 0 && <Aviso>Tocá arriba los días que vas a entrenar, o elegí una plantilla.</Aviso>}
          {dias.map((d) => (
            <div key={d.id} className="card p-3">
              <button className="flex w-full items-center gap-3 text-left" onClick={() => abrirDia(d.id)}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent font-display text-lg leading-none text-black">{DIAS_LARGO[d.diaSemana].slice(0, 3)}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{d.modulos.map((m) => MODULO_LABEL[m]).join(' + ') || 'Sin definir'}</div>
                  <div className="text-xs text-mute">{d.ejercicios.length} ejercicios</div>
                </div>
                <ChevronRight size={18} className="text-mute" />
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button className="btn-ghost text-sm" onClick={() => abrirDia(d.id)}><Pencil size={16} /> Editar</button>
                <button className="btn-ghost text-sm" onClick={() => abrirDia(d.id, true)}><RefreshCw size={16} /> Cambiar este día</button>
              </div>
            </div>
          ))}
        </section>
      </div>

      {pendiente && (
        <Hoja titulo="Usar plantilla" onCerrar={() => setPendiente(null)}>
          <p className="mb-4 text-mute">
            {pendiente === 'vacia'
              ? 'Se vacían los ejercicios de tu semana y quedan solo los días elegidos. Tu historial no se toca.'
              : `Se reemplaza tu semana actual por «${PLANTILLAS.find((p) => p.id === pendiente)!.nombre}». Tu historial no se toca.`}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => setPendiente(null)}>Cancelar</button>
            <button className="btn-primary" onClick={() => aplicar(pendiente)}>Usar plantilla</button>
          </div>
        </Hoja>
      )}
    </div>
  )
}
