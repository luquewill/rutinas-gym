import raw from '../data/exercises.json'
import type { Ejercicio, Modulo, Musculo } from '../data/types'

export const BIBLIOTECA = raw as Ejercicio[]
const POR_ID = new Map(BIBLIOTECA.map((e) => [e.id, e]))
export const getEjercicio = (id: string) => POR_ID.get(id)

export const MODULOS: Modulo[] = ['pecho', 'espalda', 'hombros', 'brazos', 'piernas', 'gluteos', 'abdominales']

export const MODULO_LABEL: Record<Modulo, string> = {
  pecho: 'Pecho', espalda: 'Espalda', hombros: 'Hombros', brazos: 'Brazos',
  piernas: 'Piernas', gluteos: 'Glúteos', abdominales: 'Abdominales',
}

export const MUSCULO_LABEL: Record<Musculo, string> = {
  pecho: 'Pecho', dorsal: 'Dorsales', espalda_alta: 'Espalda alta', espalda_baja: 'Espalda baja',
  hombro_frontal: 'Hombro frontal', hombro_lateral: 'Hombro lateral', hombro_posterior: 'Hombro posterior',
  biceps: 'Bíceps', triceps: 'Tríceps', antebrazo: 'Antebrazo',
  cuadriceps: 'Cuádriceps', isquios: 'Isquios', gluteos: 'Glúteos', aductores: 'Aductores',
  abductores: 'Abductores', pantorrillas: 'Pantorrillas', abdominales: 'Abdominales',
}

export const MUSCULOS: Musculo[] = Object.keys(MUSCULO_LABEL) as Musculo[]

export const EQUIPOS = [...new Set(BIBLIOTECA.map((e) => e.equipo))].sort()

/** Módulos "grandes": conviene no repetirlos en días seguidos. */
export const MODULOS_GRANDES: Modulo[] = ['pecho', 'espalda', 'piernas', 'gluteos']

export const DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
export const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function musculosDeModulo(m: Modulo): Musculo[] {
  const set = new Set<Musculo>()
  for (const e of BIBLIOTECA) if (e.modulo === m) set.add(e.musculoPrincipal)
  return MUSCULOS.filter((x) => set.has(x))
}

/** Normaliza para buscar ignorando tildes y mayúsculas. */
export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export function buscarEjercicios(
  lista: Ejercicio[],
  f: { texto?: string; modulo?: Modulo | ''; musculo?: Musculo | ''; equipo?: string },
): Ejercicio[] {
  const q = normalizar(f.texto ?? '')
  return lista.filter((e) => {
    if (f.modulo && e.modulo !== f.modulo) return false
    if (f.musculo && e.musculoPrincipal !== f.musculo && !e.musculosSecundarios.includes(f.musculo)) return false
    if (f.equipo && e.equipo !== f.equipo) return false
    if (q) {
      const hay = normalizar(`${e.nombre} ${MUSCULO_LABEL[e.musculoPrincipal]} ${MODULO_LABEL[e.modulo]} ${e.equipo}`)
      return q.split(/\s+/).every((t) => hay.includes(t))
    }
    return true
  })
}
