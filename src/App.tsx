import { useEffect, useRef, useState } from 'react'
import { CalendarCheck, Dumbbell, LayoutGrid } from 'lucide-react'
import { useStore } from './store'
import Hoy from './screens/Hoy'
import ArmarSemana from './screens/ArmarSemana'
import Biblioteca from './screens/Biblioteca'
import DiaEditor from './screens/DiaEditor'
import DiaTerminado from './screens/DiaTerminado'
import Historial from './screens/Historial'
import Ajustes from './screens/Ajustes'

type Tab = 'hoy' | 'semana' | 'ejercicios'
type Overlay =
  | { t: 'editor'; diaId: string; pedirCambio?: boolean }
  | { t: 'historial' }
  | { t: 'ajustes' }
  | { t: 'terminado'; sesionId: string }

const TABS: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
  { id: 'hoy', label: 'Hoy', icon: CalendarCheck },
  { id: 'semana', label: 'Armar semana', icon: LayoutGrid },
  { id: 'ejercicios', label: 'Ejercicios', icon: Dumbbell },
]

export default function App() {
  const { listo } = useStore()
  const [tab, setTab] = useState<Tab>('hoy')
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const mainRef = useRef<HTMLElement>(null)

  const vistaKey = `${tab}|${overlay?.t ?? ''}|${overlay && 'diaId' in overlay ? overlay.diaId : ''}`
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [vistaKey])

  if (!listo) {
    return <div className="flex h-full items-center justify-center font-display text-3xl text-accent">Cargando…</div>
  }

  const cerrar = () => setOverlay(null)

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col">
      <main ref={mainRef} className="flex-1 overflow-y-auto pb-[84px]">
        {overlay?.t === 'editor' ? (
          <DiaEditor diaId={overlay.diaId} pedirCambio={overlay.pedirCambio} onVolver={cerrar} />
        ) : overlay?.t === 'historial' ? (
          <Historial onVolver={cerrar} />
        ) : overlay?.t === 'ajustes' ? (
          <Ajustes onVolver={cerrar} />
        ) : overlay?.t === 'terminado' ? (
          <DiaTerminado sesionId={overlay.sesionId} onListo={() => { cerrar(); setTab('hoy') }} />
        ) : tab === 'hoy' ? (
          <Hoy
            irA={(v) => (v === 'semana' ? setTab('semana') : setOverlay({ t: v }))}
            alTerminar={(sesionId) => setOverlay({ t: 'terminado', sesionId })}
          />
        ) : tab === 'semana' ? (
          <ArmarSemana abrirDia={(diaId, pedirCambio) => setOverlay({ t: 'editor', diaId, pedirCambio })} />
        ) : (
          <Biblioteca />
        )}
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 backdrop-blur" aria-label="Navegación principal">
        <div className="mx-auto grid max-w-lg grid-cols-3">
          {TABS.map(({ id, label, icon: Icon }) => {
            const activo = tab === id && !overlay
            return (
              <button
                key={id}
                onClick={() => { setOverlay(null); setTab(id) }}
                aria-current={activo ? 'page' : undefined}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 text-xs font-bold transition ${activo ? 'text-accent' : 'text-mute'}`}
              >
                <Icon size={24} />
                {label}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
