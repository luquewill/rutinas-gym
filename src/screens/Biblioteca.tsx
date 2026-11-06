import { useState } from 'react'
import { useStore } from '../store'
import type { Ejercicio } from '../data/types'
import { DIAS_LARGO, MODULO_LABEL } from '../lib/catalog'
import { planDesdeEjercicio } from '../lib/routine'
import { BibliotecaLista, FichaEjercicio } from '../components/Ejercicios'
import { Aviso, Encabezado, EspacioAnuncio, Hoja } from '../components/Ui'

export default function Biblioteca() {
  const { semana, actualizarDia } = useStore()
  const [ficha, setFicha] = useState<Ejercicio | null>(null)
  const [aAgregar, setAAgregar] = useState<Ejercicio | null>(null)
  const [ok, setOk] = useState('')

  const dias = [...semana.dias].sort((a, b) => a.diaSemana - b.diaSemana)

  return (
    <div>
      <Encabezado titulo="Ejercicios" subtitulo="Biblioteca completa" />
      <div className="space-y-3 p-4 pb-8">
        <EspacioAnuncio ubicacion="biblioteca" />
        {ok && <Aviso>{ok}</Aviso>}
        <BibliotecaLista onVer={setFicha} onAgregar={setAAgregar} etiquetaAgregar="A un día" />
      </div>
      {ficha && <FichaEjercicio ejercicio={ficha} onCerrar={() => setFicha(null)} />}
      {aAgregar && (
        <Hoja titulo="Agregar a un día" onCerrar={() => setAAgregar(null)}>
          <p className="mb-3 text-sm text-mute">¿A qué día querés sumar <b className="text-white">{aAgregar.nombre}</b>?</p>
          {dias.length === 0 && <p className="text-mute">Primero armá tu semana.</p>}
          <div className="space-y-2">
            {dias.map((d) => (
              <button
                key={d.id}
                className="btn-ghost w-full justify-between"
                onClick={() => {
                  void actualizarDia(d.id, (x) => ({ ...x, ejercicios: [...x.ejercicios, planDesdeEjercicio(aAgregar)] }))
                  setOk(`${aAgregar.nombre} agregado al ${DIAS_LARGO[d.diaSemana]}.`)
                  setAAgregar(null)
                }}
              >
                <span>{DIAS_LARGO[d.diaSemana]}</span>
                <span className="text-sm font-normal text-mute">{d.modulos.map((m) => MODULO_LABEL[m]).join(' + ')}</span>
              </button>
            ))}
          </div>
        </Hoja>
      )}
    </div>
  )
}
