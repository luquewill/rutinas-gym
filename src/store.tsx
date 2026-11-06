import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { repo } from './data'
import { AJUSTES_DEFAULT } from './data/repository'
import type { Ajustes, DiaPlan, Semana, SesionRegistro } from './data/types'

interface Store {
  listo: boolean
  semana: Semana
  ajustes: Ajustes
  sesiones: SesionRegistro[]
  setSemana: (s: Semana) => Promise<void>
  actualizarDia: (diaId: string, fn: (d: DiaPlan) => DiaPlan) => Promise<void>
  guardarAjustes: (a: Ajustes) => Promise<void>
  guardarSesion: (s: SesionRegistro) => Promise<void>
  recargar: () => Promise<void>
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore fuera de StoreProvider')
  return c
}

const VACIA: Semana = { id: 'activa', plantilla: 'vacia', dias: [] }

export function StoreProvider({ children }: { children: ReactNode }) {
  const [listo, setListo] = useState(false)
  const [semana, setSemanaState] = useState<Semana>(VACIA)
  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES_DEFAULT)
  const [sesiones, setSesiones] = useState<SesionRegistro[]>([])

  const cargar = useCallback(async () => {
    // Primera vez: semana vacía. La persona arma su rutina de cero o elige una plantilla.
    const s = (await repo.getSemana()) ?? VACIA
    setSemanaState(s)
    setAjustes(await repo.getAjustes())
    setSesiones(await repo.listSesiones())
    setListo(true)
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const setSemana = useCallback(async (s: Semana) => {
    setSemanaState(s)
    await repo.saveSemana(s)
  }, [])

  const actualizarDia = useCallback(
    async (diaId: string, fn: (d: DiaPlan) => DiaPlan) => {
      const nueva = { ...semana, dias: semana.dias.map((d) => (d.id === diaId ? fn(d) : d)) }
      await setSemana(nueva)
    },
    [semana, setSemana],
  )

  const guardarAjustes = useCallback(async (a: Ajustes) => {
    setAjustes(a)
    await repo.saveAjustes(a)
  }, [])

  const guardarSesion = useCallback(async (s: SesionRegistro) => {
    setSesiones((prev) => [s, ...prev.filter((x) => x.id !== s.id)].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.inicio - a.inicio))
    await repo.saveSesion(s)
  }, [])

  const value = useMemo(
    () => ({ listo, semana, ajustes, sesiones, setSemana, actualizarDia, guardarAjustes, guardarSesion, recargar: cargar }),
    [listo, semana, ajustes, sesiones, setSemana, actualizarDia, guardarAjustes, guardarSesion, cargar],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
