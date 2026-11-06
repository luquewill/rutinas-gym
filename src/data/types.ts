export type Modulo = 'pecho' | 'espalda' | 'hombros' | 'brazos' | 'piernas' | 'gluteos' | 'abdominales'

export type Musculo =
  | 'pecho' | 'dorsal' | 'espalda_alta' | 'espalda_baja'
  | 'hombro_frontal' | 'hombro_lateral' | 'hombro_posterior'
  | 'biceps' | 'triceps' | 'antebrazo'
  | 'cuadriceps' | 'isquios' | 'gluteos' | 'aductores' | 'abductores' | 'pantorrillas'
  | 'abdominales'

export interface Ejercicio {
  id: string
  nombre: string
  modulo: Modulo
  musculoPrincipal: Musculo
  musculosSecundarios: Musculo[]
  equipo: string
  tipo: 'compuesto' | 'aislamiento'
  nivel: 'principiante' | 'intermedio' | 'avanzado'
  seriesDefault: number
  repsDefault: string
  descansoDefault: number
  unilateral: boolean
  tecnica: string[]
  media: { video: string; poster: string; imagenes: string[] }
}

/** Ejercicio dentro del plan de un día (con series/reps/descanso editables). */
export interface EjercicioPlan {
  ejercicioId: string
  series: number
  reps: string
  descanso: number
}

export interface DiaPlan {
  id: string
  /** 0 = domingo ... 6 = sábado */
  diaSemana: number
  modulos: Modulo[]
  ejercicios: EjercicioPlan[]
}

export interface Semana {
  id: 'activa'
  plantilla: string
  dias: DiaPlan[]
}

export interface SerieRegistro {
  hecha: boolean
  peso?: number
  reps?: number
}

export interface SesionRegistro {
  id: string // `${fecha}_${diaId}`
  fecha: string // YYYY-MM-DD
  diaId: string
  series: Record<string, SerieRegistro[]> // por ejercicioId
  inicio: number
  fin?: number
}

export interface Ajustes {
  descansoDefault: number
  vibracion: boolean
  diasEntreno: number[]
}

export interface BackupV1 {
  version: 1
  exportadoEn: string
  semana: Semana | null
  sesiones: SesionRegistro[]
  ajustes: Ajustes
}
