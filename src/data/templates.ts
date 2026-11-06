import type { DiaPlan, EjercicioPlan, Modulo, Semana } from './types'
import { BIBLIOTECA, getEjercicio } from '../lib/catalog'
import { planDesdeEjercicio, recomendarEjercicios, type Rng } from '../lib/routine'

export type PlantillaId = 'vacia' | 'tres-dias' | 'cuatro-dias' | 'mi-rutina'

export interface PlantillaInfo {
  id: PlantillaId
  nombre: string
  descripcion: string
  dias: number
  diasSemanaDefault: number[]
}

export const PLANTILLAS: PlantillaInfo[] = [
  { id: 'vacia', nombre: 'Desde cero', descripcion: 'Elegís los días y armás cada uno a tu gusto', dias: 0, diasSemanaDefault: [] },
  { id: 'tres-dias', nombre: '3 días', descripcion: 'Pecho + Espalda / Piernas / Hombros + Brazos', dias: 3, diasSemanaDefault: [1, 3, 5] },
  { id: 'cuatro-dias', nombre: '4 días', descripcion: 'Glúteos + Piernas / Espalda + Brazos / Piernas / Hombros + Abdominales', dias: 4, diasSemanaDefault: [1, 2, 4, 5] },
  { id: 'mi-rutina', nombre: 'Rutina de ejemplo', descripcion: '4 días con ejercicios fijos: glúteos e isquios · espalda y bíceps · glúteos y cuádriceps · hombros y tríceps', dias: 4, diasSemanaDefault: [1, 2, 4, 5] },
]

const MODULOS_PLANTILLA: Record<'tres-dias' | 'cuatro-dias', Modulo[][]> = {
  'tres-dias': [['pecho', 'espalda'], ['piernas'], ['hombros', 'brazos']],
  'cuatro-dias': [['gluteos', 'piernas'], ['espalda', 'brazos'], ['piernas'], ['hombros', 'abdominales']],
}

const ej = (id: string, series?: number, reps?: string): EjercicioPlan => {
  const e = getEjercicio(id)
  if (!e) throw new Error(`Ejercicio inexistente en plantilla: ${id}`)
  return { ...planDesdeEjercicio(e), ...(series ? { series } : {}), ...(reps ? { reps } : {}) }
}

/** Mi rutina actual: ejercicios fijos, tal como la entrenás hoy. */
export function miRutina(): DiaPlan[] {
  return [
    {
      id: 'dia-1', diaSemana: 1, modulos: ['gluteos', 'piernas'],
      ejercicios: [ej('hip-thrust-maquina'), ej('peso-muerto-rumano'), ej('sentadilla-bulgara'), ej('curl-femoral-sentado'), ej('aduccion-cadera')],
    },
    {
      id: 'dia-2', diaSemana: 2, modulos: ['espalda', 'brazos', 'abdominales'],
      ejercicios: [ej('jalon-pecho'), ej('remo-maquina'), ej('vuelo-invertido-mancuernas'), ej('face-pull'), ej('curl-martillo'), ej('curl-mancuernas'), ej('crunch-abdominal'), ej('plancha', 3, '30 s')],
    },
    {
      id: 'dia-4', diaSemana: 4, modulos: ['gluteos', 'piernas'],
      ejercicios: [ej('sentadilla-goblet'), ej('prensa-piernas'), ej('sentadilla-sumo'), ej('extension-cuadriceps'), ej('abductores-maquina'), ej('pantorrilla-de-pie')],
    },
    {
      id: 'dia-5', diaSemana: 5, modulos: ['hombros', 'brazos', 'abdominales'],
      ejercicios: [ej('press-militar-mancuernas'), ej('elevacion-lateral'), ej('vuelo-lateral-mancuernas'), ej('extension-triceps-polea'), ej('extension-overhead-disco'), ej('plancha', 3, '30 s'), ej('crunch-abdominal')],
    },
  ]
}

export function construirSemana(id: PlantillaId, rng: Rng, diasSemana?: number[]): Semana {
  if (id === 'mi-rutina') return { id: 'activa', plantilla: id, dias: miRutina() }
  if (id === 'vacia') {
    const dias = [...(diasSemana ?? [])].sort((a, b) => a - b)
    return { id: 'activa', plantilla: id, dias: dias.map((d) => ({ id: `dia-${d}`, diaSemana: d, modulos: [], ejercicios: [] })) }
  }
  const info = PLANTILLAS.find((p) => p.id === id)!
  const dias = diasSemana && diasSemana.length === info.dias ? [...diasSemana].sort((a, b) => a - b) : info.diasSemanaDefault
  const usados = new Set<string>()
  const out: DiaPlan[] = MODULOS_PLANTILLA[id].map((modulos, i) => {
    const lista = recomendarEjercicios({ modulos, biblioteca: BIBLIOTECA, excluir: usados, rng })
    lista.forEach((e) => usados.add(e.id))
    return { id: `dia-${dias[i]}`, diaSemana: dias[i], modulos, ejercicios: lista.map(planDesdeEjercicio) }
  })
  return { id: 'activa', plantilla: id, dias: out }
}
