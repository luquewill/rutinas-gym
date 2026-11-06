import { describe, expect, it } from 'vitest'
import { diaDeHoy, reasignarDias, ultimoPeso, volumenKg } from './semana'
import { miRutina } from '../data/templates'
import type { SesionRegistro } from '../data/types'

describe('semana', () => {
  it('reasignarDias conserva el contenido por orden y deja vacíos los días nuevos', () => {
    const r = reasignarDias(miRutina(), [1, 3, 5])
    expect(r.map((d) => d.diaSemana)).toEqual([1, 3, 5])
    expect(r[1].ejercicios).toHaveLength(8) // el 2º día viejo (martes) pasa al miércoles
    const mas = reasignarDias(miRutina().slice(0, 3), [1, 2, 4, 5])
    expect(mas[3].ejercicios).toEqual([])
  })
  it('diaDeHoy devuelve hoy o el próximo día de entrenamiento', () => {
    const dias = miRutina() // lun, mar, jue, vie
    expect(diaDeHoy(dias, 4)).toMatchObject({ esHoy: true, dia: { diaSemana: 4 } })
    expect(diaDeHoy(dias, 3)).toMatchObject({ esHoy: false, dia: { diaSemana: 4 } }) // miércoles -> jueves
    expect(diaDeHoy(dias, 6)).toMatchObject({ esHoy: false, dia: { diaSemana: 1 } }) // sábado -> lunes
    expect(diaDeHoy([], 1)).toBeNull()
  })
  it('ultimoPeso y volumen', () => {
    const s = (id: string, peso: number): SesionRegistro => ({ id, fecha: id, diaId: 'd', inicio: 0, series: { x: [{ hecha: true, peso, reps: 10 }, { hecha: false, peso: 999, reps: 10 }] } })
    expect(ultimoPeso([s('b', 50), s('a', 40)], 'x')).toEqual({ peso: 50, reps: 10 })
    expect(ultimoPeso([s('b', 50), s('a', 40)], 'x', 'b')).toEqual({ peso: 40, reps: 10 })
    expect(volumenKg(s('b', 50))).toBe(500)
  })
})
