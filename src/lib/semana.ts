import type { DiaPlan, SesionRegistro } from '../data/types'

/**
 * Cambia los días de la semana en que se entrena. Conserva el contenido por orden:
 * el 1er día nuevo hereda el 1er día viejo, etc. Los días extra quedan vacíos.
 */
export function reasignarDias(actuales: DiaPlan[], nuevos: number[]): DiaPlan[] {
  const viejos = [...actuales].sort((a, b) => a.diaSemana - b.diaSemana)
  return [...nuevos]
    .sort((a, b) => a - b)
    .map((d, i) => ({
      id: `dia-${d}`,
      diaSemana: d,
      modulos: viejos[i]?.modulos ?? [],
      ejercicios: viejos[i]?.ejercicios ?? [],
    }))
}

/** Día de hoy si se entrena hoy; si no, el próximo día de entrenamiento. */
export function diaDeHoy(dias: DiaPlan[], hoy = new Date().getDay()): { dia: DiaPlan; esHoy: boolean } | null {
  if (dias.length === 0) return null
  const exacto = dias.find((d) => d.diaSemana === hoy)
  if (exacto) return { dia: exacto, esHoy: true }
  const prox = [...dias].sort((a, b) => ((a.diaSemana - hoy + 7) % 7) - ((b.diaSemana - hoy + 7) % 7))[0]
  return { dia: prox, esHoy: false }
}

export function seriesTotales(s: SesionRegistro | undefined, ids: string[]): number {
  if (!s) return 0
  return ids.reduce((acc, id) => acc + (s.series[id]?.filter((x) => x.hecha).length ?? 0), 0)
}

export function volumenKg(s: SesionRegistro): number {
  return Object.values(s.series)
    .flat()
    .reduce((acc, x) => acc + (x.hecha && x.peso && x.reps ? x.peso * x.reps : 0), 0)
}

/** Último registro con peso de un ejercicio, anterior a `excluirId`. */
export function ultimoPeso(sesiones: SesionRegistro[], ejercicioId: string, excluirId?: string): { peso: number; reps?: number } | null {
  for (const s of sesiones) {
    if (s.id === excluirId) continue
    const series = s.series[ejercicioId]?.filter((x) => x.hecha && x.peso)
    if (series && series.length) {
      const mejor = series.reduce((a, b) => ((b.peso ?? 0) > (a.peso ?? 0) ? b : a))
      return { peso: mejor.peso!, reps: mejor.reps }
    }
  }
  return null
}
