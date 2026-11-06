import { useRef, useState } from 'react'
import { Download, Minus, Plus, Trash2, Upload } from 'lucide-react'
import { repo } from '../data'
import { useStore } from '../store'
import { hoyISO } from '../lib/dates'
import { DiasSelector } from '../components/DiasSelector'
import { Aviso, Encabezado, Hoja } from '../components/Ui'

export default function Ajustes({ onVolver }: { onVolver: () => void }) {
  const { ajustes, guardarAjustes, semana, setSemana, recargar } = useStore()
  const [msg, setMsg] = useState<{ tipo: 'info' | 'error'; texto: string } | null>(null)
  const [confirmar, setConfirmar] = useState(false)
  const archivo = useRef<HTMLInputElement>(null)

  const exportar = async () => {
    const data = await repo.exportar()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `rutinas-gym-${hoyISO()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setMsg({ tipo: 'info', texto: 'Listo: se descargó tu respaldo.' })
  }

  const importar = async (f: File) => {
    try {
      await repo.importar(JSON.parse(await f.text()))
      await recargar()
      setMsg({ tipo: 'info', texto: 'Datos importados correctamente.' })
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No pude leer el archivo.' })
    }
  }

  const aplicarDescansoATodos = () => {
    void setSemana({ ...semana, dias: semana.dias.map((d) => ({ ...d, ejercicios: d.ejercicios.map((e) => ({ ...e, descanso: ajustes.descansoDefault })) })) })
    setMsg({ tipo: 'info', texto: `Descanso de ${ajustes.descansoDefault} s aplicado a toda tu semana.` })
  }

  const borrar = async () => {
    await repo.borrarTodo()
    setConfirmar(false)
    await recargar()
    setMsg({ tipo: 'info', texto: 'Se borraron tus datos. Empezás de cero.' })
  }

  return (
    <div>
      <Encabezado titulo="Ajustes" onVolver={onVolver} />
      <div className="space-y-4 p-4 pb-8">
        {msg && <Aviso tipo={msg.tipo}>{msg.texto}</Aviso>}

        <section className="card space-y-3 p-4">
          <h2 className="text-xl">Días de entrenamiento</h2>
          <DiasSelector />
        </section>

        <section className="card space-y-3 p-4">
          <h2 className="text-xl">Descanso por defecto</h2>
          <div className="flex items-center justify-between gap-2">
            <button className="btn-ghost !w-12 !px-0" onClick={() => guardarAjustes({ ...ajustes, descansoDefault: Math.max(15, ajustes.descansoDefault - 15) })} aria-label="Menos descanso"><Minus size={18} /></button>
            <span className="font-display text-4xl">{ajustes.descansoDefault} s</span>
            <button className="btn-ghost !w-12 !px-0" onClick={() => guardarAjustes({ ...ajustes, descansoDefault: Math.min(300, ajustes.descansoDefault + 15) })} aria-label="Más descanso"><Plus size={18} /></button>
          </div>
          <button className="btn-ghost w-full" onClick={aplicarDescansoATodos}>Aplicar a todos mis ejercicios</button>
          <p className="text-xs text-mute">Se usa en el temporizador cuando un ejercicio no tiene descanso propio.</p>
        </section>

        <section className="card p-4">
          <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3">
            <span>
              <span className="block font-bold">Vibración al terminar el descanso</span>
              <span className="block text-xs text-mute">Funciona en Android; iPhone no la permite.</span>
            </span>
            <input type="checkbox" className="h-6 w-6 accent-[#FF6B00]" checked={ajustes.vibracion} onChange={(e) => guardarAjustes({ ...ajustes, vibracion: e.target.checked })} />
          </label>
        </section>

        <section className="card space-y-2 p-4">
          <h2 className="text-xl">Mis datos</h2>
          <button className="btn-ghost w-full" onClick={exportar}><Download size={18} /> Exportar (JSON)</button>
          <button className="btn-ghost w-full" onClick={() => archivo.current?.click()}><Upload size={18} /> Importar (JSON)</button>
          <input ref={archivo} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void importar(f); e.target.value = '' }} />
          <button className="btn-ghost w-full !border-accent/50 text-accent" onClick={() => setConfirmar(true)}><Trash2 size={18} /> Borrar todos mis datos</button>
        </section>
        <p className="text-center text-xs text-mute">Tus datos viven en este dispositivo.</p>
      </div>

      {confirmar && (
        <Hoja titulo="¿Borrar todo?" onCerrar={() => setConfirmar(false)}>
          <p className="mb-4 text-mute">Se borran tu semana, tu historial y tus ajustes de este dispositivo. No se puede deshacer. Si querés conservarlos, exportá antes.</p>
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost" onClick={() => setConfirmar(false)}>Cancelar</button>
            <button className="btn-primary" onClick={borrar}>Sí, borrar</button>
          </div>
        </Hoja>
      )}
    </div>
  )
}
