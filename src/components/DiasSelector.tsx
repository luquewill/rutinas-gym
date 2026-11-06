import { useState } from 'react'
import { useStore } from '../store'
import { DIAS_CORTO } from '../lib/catalog'
import { reasignarDias } from '../lib/semana'
import { Aviso } from './Ui'

const ORDEN = [1, 2, 3, 4, 5, 6, 0]
const DEFAULTS: Record<number, number[]> = { 3: [1, 3, 5], 4: [1, 2, 4, 5] }

/** Elegís 3 o 4 días y cuáles. Reorganiza la semana conservando el contenido por orden. */
export function DiasSelector() {
  const { semana, setSemana, guardarAjustes, ajustes } = useStore()
  const actuales = semana.dias.map((d) => d.diaSemana)
  const [n, setN] = useState<3 | 4>(actuales.length === 3 ? 3 : 4)
  const [msg, setMsg] = useState('')

  const aplicar = async (dias: number[]) => {
    await setSemana({ ...semana, dias: reasignarDias(semana.dias, dias) })
    await guardarAjustes({ ...ajustes, diasEntreno: [...dias].sort((a, b) => a - b) })
  }

  const cambiarN = (nuevo: 3 | 4) => {
    setMsg('')
    setN(nuevo)
    if (actuales.length === 0 || nuevo === actuales.length) return
    if (nuevo < actuales.length) void aplicar(actuales.slice(0, nuevo))
    else {
      const extra = ORDEN.filter((d) => !actuales.includes(d))
      void aplicar([...actuales, ...extra].slice(0, nuevo))
    }
  }

  const alternar = (d: number) => {
    if (actuales.includes(d)) {
      const dia = semana.dias.find((x) => x.diaSemana === d)
      if (dia && (dia.ejercicios.length > 0 || dia.modulos.length > 0)) {
        setMsg(`El ${DIAS_CORTO[d]} ya tiene contenido. Para moverlo, tocá otro día libre.`)
        return
      }
      setMsg('')
      void aplicar(actuales.filter((x) => x !== d))
      return
    }
    if (actuales.length < n) {
      setMsg('')
      void aplicar([...actuales, d])
      return
    }
    // Ya tiene los N días: mueve el más cercano.
    const masCerca = [...actuales].sort((a, b) => Math.abs(a - d) - Math.abs(b - d))[0]
    setMsg(`Moví el ${DIAS_CORTO[masCerca]} al ${DIAS_CORTO[d]}.`)
    void aplicar(actuales.map((x) => (x === masCerca ? d : x)))
  }

  const faltan = n - actuales.length

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {([3, 4] as const).map((k) => (
          <button key={k} className={`chip flex-1 justify-center ${n === k ? 'chip-on' : ''}`} onClick={() => cambiarN(k)}>
            {k} días
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {ORDEN.map((d) => (
          <button
            key={d}
            onClick={() => alternar(d)}
            aria-pressed={actuales.includes(d)}
            className={`flex min-h-[48px] items-center justify-center rounded-xl border text-sm font-bold transition active:scale-95 ${actuales.includes(d) ? 'border-accent bg-accent text-black' : 'border-line bg-card text-white'}`}
          >
            {DIAS_CORTO[d]}
          </button>
        ))}
      </div>
      {msg && <Aviso>{msg}</Aviso>}
      <p className="text-xs text-mute">
        {faltan > 0
          ? `Tocá ${faltan === 1 ? 'un día más' : `${faltan} días más`} para completar tu semana. Sugerencia: ${DEFAULTS[n].map((d) => DIAS_CORTO[d]).join(' · ')}.`
          : `Tocá un día libre para mover tu entrenamiento a ese día. Sugerencia: ${DEFAULTS[n].map((d) => DIAS_CORTO[d]).join(' · ')}.`}
      </p>
    </div>
  )
}
