import type { DiaPlan, Ejercicio, EjercicioPlan, Modulo, Musculo } from '../data/types'
import { DIAS_LARGO, MODULOS, MODULOS_GRANDES, MODULO_LABEL } from './catalog'

export const MAX_MODULOS = 2

export type Rng = () => number

/** RNG determinístico (mulberry32) para poder testear. */
export function crearRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function mezclar<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Abdominales es complemento: no cuenta para el límite de 2 módulos. */
export const modulosPrincipales = (mods: Modulo[]) => mods.filter((m) => m !== 'abdominales')

export interface ResultadoModulos {
  modulos: Modulo[]
  error?: string
}

/** Alterna un módulo respetando el máximo de 2 (abdominales no suma). */
export function alternarModulo(actuales: Modulo[], m: Modulo): ResultadoModulos {
  if (actuales.includes(m)) return { modulos: actuales.filter((x) => x !== m) }
  if (m !== 'abdominales' && modulosPrincipales(actuales).length >= MAX_MODULOS) {
    return {
      modulos: actuales,
      error: 'Máximo 2 módulos por día (Abdominales es un complemento y no suma). Sacá uno para agregar otro.',
    }
  }
  return { modulos: [...actuales, m] }
}

export function cantidadObjetivo(mods: Modulo[], rng: Rng): number {
  const n = modulosPrincipales(mods).length
  if (n >= 2) return 6 + Math.floor(rng() * 3) // 6-8
  return 5 + Math.floor(rng() * 2) // 5-6
}

export function planDesdeEjercicio(e: Ejercicio): EjercicioPlan {
  return { ejercicioId: e.id, series: e.seriesDefault, reps: e.repsDefault, descanso: e.descansoDefault }
}

export interface OpcionesRecomendar {
  modulos: Modulo[]
  biblioteca: Ejercicio[]
  /** Ejercicios ya usados en otros días de la semana: se evitan. */
  excluir?: Set<string>
  rng?: Rng
}

/**
 * Arma una lista de ejercicios para un día. Función pura (el azar entra por `rng`).
 * - 1 módulo principal: 5-6 ejercicios. 2 módulos: 6-8.
 * - Compuestos primero, después aislamiento, abdominales al final.
 * - Reparte entre los músculos de cada módulo y no repite ejercicios de `excluir`.
 */
export function recomendarEjercicios({ modulos, biblioteca, excluir = new Set(), rng = Math.random }: OpcionesRecomendar): Ejercicio[] {
  const principales = modulosPrincipales(modulos)
  const conAbs = modulos.includes('abdominales')
  const bloques: { modulo: Modulo; n: number }[] = []

  if (principales.length === 0) {
    if (conAbs) bloques.push({ modulo: 'abdominales', n: 5 })
  } else {
    const total = cantidadObjetivo(modulos, rng)
    const base = Math.floor(total / principales.length)
    const resto = total - base * principales.length
    principales.forEach((m, i) => bloques.push({ modulo: m, n: base + (i < resto ? 1 : 0) }))
    if (conAbs) bloques.push({ modulo: 'abdominales', n: 2 })
  }

  const usados = new Set(excluir)
  const elegidos: Ejercicio[] = []

  for (const { modulo, n } of bloques) {
    const pool = biblioteca.filter((e) => e.modulo === modulo)
    const musculos = mezclar([...new Set(pool.map((e) => e.musculoPrincipal))] as Musculo[], rng)
    const nCompuestos = modulo === 'abdominales' ? 0 : Math.ceil(n * 0.4)
    for (let i = 0; i < n; i++) {
      const libres = pool.filter((e) => !usados.has(e.id))
      if (libres.length === 0) break
      const musculo = musculos[i % musculos.length]
      const tipo = i < nCompuestos ? 'compuesto' : 'aislamiento'
      const cand =
        [
          libres.filter((e) => e.musculoPrincipal === musculo && e.tipo === tipo),
          libres.filter((e) => e.musculoPrincipal === musculo),
          libres.filter((e) => e.tipo === tipo),
          libres,
        ].find((c) => c.length > 0) ?? []
      const e = cand[Math.floor(rng() * cand.length)]
      usados.add(e.id)
      elegidos.push(e)
    }
  }

  const orden = (e: Ejercicio) => (e.modulo === 'abdominales' ? 2 : e.tipo === 'compuesto' ? 0 : 1)
  return elegidos
    .map((e, i) => ({ e, i }))
    .sort((a, b) => orden(a.e) - orden(b.e) || a.i - b.i)
    .map((x) => x.e)
}

/** Alternativas del mismo músculo principal; primero las del mismo equipo. */
export function alternativas(actual: Ejercicio, biblioteca: Ejercicio[], enUso: Set<string> = new Set()): Ejercicio[] {
  return biblioteca
    .filter((e) => e.id !== actual.id && !enUso.has(e.id) && e.musculoPrincipal === actual.musculoPrincipal)
    .sort((a, b) => {
      const ea = a.equipo === actual.equipo ? 0 : 1
      const eb = b.equipo === actual.equipo ? 0 : 1
      if (ea !== eb) return ea - eb
      const ta = a.tipo === actual.tipo ? 0 : 1
      const tb = b.tipo === actual.tipo ? 0 : 1
      return ta - tb || a.nombre.localeCompare(b.nombre, 'es')
    })
}

export function moverItem<T>(arr: T[], desde: number, hasta: number): T[] {
  if (hasta < 0 || hasta >= arr.length || desde === hasta) return arr
  const a = [...arr]
  const [x] = a.splice(desde, 1)
  a.splice(hasta, 0, x)
  return a
}

export function ejerciciosUsadosEnSemana(dias: DiaPlan[], exceptoDiaId?: string): Set<string> {
  const s = new Set<string>()
  for (const d of dias) if (d.id !== exceptoDiaId) d.ejercicios.forEach((e) => s.add(e.ejercicioId))
  return s
}

/** Avisos suaves: módulos grandes en días seguidos y módulos que faltan. */
export function avisosSemana(dias: DiaPlan[]): string[] {
  const avisos: string[] = []
  const ordenados = [...dias].sort((a, b) => a.diaSemana - b.diaSemana)
  for (let i = 0; i < ordenados.length; i++) {
    for (let j = i + 1; j < ordenados.length; j++) {
      const a = ordenados[i], b = ordenados[j]
      const seguidos = b.diaSemana - a.diaSemana === 1 || (a.diaSemana === 0 && b.diaSemana === 6)
      if (!seguidos) continue
      for (const m of MODULOS_GRANDES) {
        if (a.modulos.includes(m) && b.modulos.includes(m)) {
          avisos.push(`${MODULO_LABEL[m]} se repite el ${DIAS_LARGO[a.diaSemana]} y el ${DIAS_LARGO[b.diaSemana]}: tu cuerpo necesita descanso entre sesiones del mismo grupo.`)
        }
      }
    }
  }
  const presentes = new Set(dias.flatMap((d) => d.modulos))
  const faltan = MODULOS.filter((m) => m !== 'abdominales' && !presentes.has(m))
  if (dias.length > 0 && faltan.length > 0) {
    avisos.push(`Esta semana no trabajás: ${faltan.map((m) => MODULO_LABEL[m]).join(', ')}. Si es a propósito, perfecto.`)
  }
  return avisos
}
