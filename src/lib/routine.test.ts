import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { BIBLIOTECA, buscarEjercicios, getEjercicio } from './catalog'
import { alternarModulo, alternativas, avisosSemana, crearRng, recomendarEjercicios } from './routine'
import { construirSemana, miRutina } from '../data/templates'
import { crearIdbRepository } from '../data/idb'
import type { DiaPlan, Modulo } from '../data/types'

const rec = (modulos: Modulo[], seed = 1, excluir?: Set<string>) =>
  recomendarEjercicios({ modulos, biblioteca: BIBLIOTECA, rng: crearRng(seed), excluir })

describe('biblioteca', () => {
  it('tiene al menos 80 ejercicios con datos completos', () => {
    expect(BIBLIOTECA.length).toBeGreaterThanOrEqual(80)
    for (const e of BIBLIOTECA) {
      expect(e.tecnica.length).toBeGreaterThanOrEqual(2)
      expect(e.tecnica.length).toBeLessThanOrEqual(3)
      expect(e.media.video).toContain(e.id)
    }
    expect(new Set(BIBLIOTECA.map((e) => e.id)).size).toBe(BIBLIOTECA.length)
  })
  it('el buscador ignora tildes y mayúsculas', () => {
    expect(buscarEjercicios(BIBLIOTECA, { texto: 'GLUTEOS' }).length).toBeGreaterThan(0)
    expect(buscarEjercicios(BIBLIOTECA, { texto: 'peso muerto rumano' }).map((e) => e.id)).toContain('peso-muerto-rumano')
    expect(buscarEjercicios(BIBLIOTECA, { texto: 'biceps' }).length).toBeGreaterThan(0)
  })
})

describe('recomendarEjercicios', () => {
  it('1 módulo: 5 o 6 ejercicios', () => {
    for (let s = 1; s <= 30; s++) {
      const n = rec(['pecho'], s).length
      expect(n).toBeGreaterThanOrEqual(5)
      expect(n).toBeLessThanOrEqual(6)
    }
  })
  it('2 módulos: entre 6 y 8 ejercicios', () => {
    for (let s = 1; s <= 30; s++) {
      const n = rec(['espalda', 'brazos'], s).length
      expect(n).toBeGreaterThanOrEqual(6)
      expect(n).toBeLessThanOrEqual(8)
    }
  })
  it('compuestos primero, después aislamiento, abdominales al final', () => {
    for (let s = 1; s <= 30; s++) {
      const l = rec(['hombros', 'brazos', 'abdominales'], s)
      const rank = (e: (typeof l)[number]) => (e.modulo === 'abdominales' ? 2 : e.tipo === 'compuesto' ? 0 : 1)
      const ranks = l.map(rank)
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
      expect(l[l.length - 1].modulo).toBe('abdominales')
    }
  })
  it('abdominales como complemento no cambia el total de los módulos principales', () => {
    const sinAbs = rec(['hombros'], 7).length
    const conAbs = rec(['hombros', 'abdominales'], 7)
    expect(conAbs.filter((e) => e.modulo !== 'abdominales').length).toBe(sinAbs)
    expect(conAbs.filter((e) => e.modulo === 'abdominales').length).toBe(2)
  })
  it('no repite ejercicios dentro del día ni los excluidos', () => {
    const excluir = new Set(BIBLIOTECA.filter((e) => e.modulo === 'piernas').slice(0, 10).map((e) => e.id))
    for (let s = 1; s <= 30; s++) {
      const l = rec(['piernas', 'gluteos'], s, excluir)
      expect(new Set(l.map((e) => e.id)).size).toBe(l.length)
      l.forEach((e) => expect(excluir.has(e.id)).toBe(false))
    }
  })
  it('reparte entre los músculos del módulo', () => {
    const l = rec(['piernas'], 3)
    expect(new Set(l.map((e) => e.musculoPrincipal)).size).toBeGreaterThanOrEqual(4)
  })
  it('es determinística con la misma semilla y cambia con otra ("Otra combinación")', () => {
    expect(rec(['pecho', 'espalda'], 5).map((e) => e.id)).toEqual(rec(['pecho', 'espalda'], 5).map((e) => e.id))
    const distintas = new Set(Array.from({ length: 10 }, (_, i) => rec(['pecho', 'espalda'], i + 100).map((e) => e.id).join()))
    expect(distintas.size).toBeGreaterThan(1)
  })
})

describe('alternarModulo', () => {
  it('rechaza un tercer módulo con aviso', () => {
    const r = alternarModulo(['pecho', 'espalda'], 'hombros')
    expect(r.modulos).toEqual(['pecho', 'espalda'])
    expect(r.error).toMatch(/Máximo 2/)
  })
  it('abdominales no suma al límite', () => {
    const r = alternarModulo(['pecho', 'espalda'], 'abdominales')
    expect(r.modulos).toEqual(['pecho', 'espalda', 'abdominales'])
    expect(r.error).toBeUndefined()
    expect(alternarModulo(['pecho', 'abdominales'], 'espalda').modulos).toHaveLength(3)
  })
  it('permite sacar un módulo', () => {
    expect(alternarModulo(['pecho', 'espalda'], 'pecho').modulos).toEqual(['espalda'])
  })
})

describe('alternativas', () => {
  it('mismo músculo principal y primero el mismo equipo', () => {
    const actual = getEjercicio('curl-mancuernas')!
    const alts = alternativas(actual, BIBLIOTECA)
    expect(alts.length).toBeGreaterThan(0)
    alts.forEach((a) => expect(a.musculoPrincipal).toBe(actual.musculoPrincipal))
    const idxPrimeroOtroEquipo = alts.findIndex((a) => a.equipo !== actual.equipo)
    alts.slice(0, idxPrimeroOtroEquipo).forEach((a) => expect(a.equipo).toBe(actual.equipo))
    expect(alts.some((a) => a.id === actual.id)).toBe(false)
  })
})

describe('avisosSemana', () => {
  const dia = (diaSemana: number, modulos: Modulo[]): DiaPlan => ({ id: `d${diaSemana}`, diaSemana, modulos, ejercicios: [] })
  it('avisa módulo grande en días seguidos', () => {
    const a = avisosSemana([dia(1, ['piernas']), dia(2, ['piernas', 'gluteos'])])
    expect(a.some((x) => x.includes('Piernas se repite'))).toBe(true)
  })
  it('no avisa si hay un día de descanso en el medio', () => {
    const a = avisosSemana([dia(1, ['piernas']), dia(3, ['piernas'])])
    expect(a.some((x) => x.includes('se repite'))).toBe(false)
  })
  it('avisa los módulos que faltan', () => {
    const a = avisosSemana([dia(1, ['pecho'])])
    expect(a.some((x) => x.includes('no trabajás') && x.includes('Piernas'))).toBe(true)
  })
})

describe('plantillas', () => {
  it('3 y 4 días respetan máximo 2 módulos principales y no repiten ejercicios', () => {
    for (const id of ['tres-dias', 'cuatro-dias'] as const) {
      const s = construirSemana(id, crearRng(9))
      const ids = s.dias.flatMap((d) => d.ejercicios.map((e) => e.ejercicioId))
      expect(new Set(ids).size).toBe(ids.length)
      s.dias.forEach((d) => expect(d.modulos.filter((m) => m !== 'abdominales').length).toBeLessThanOrEqual(2))
    }
    expect(construirSemana('tres-dias', crearRng(1)).dias).toHaveLength(3)
    expect(construirSemana('cuatro-dias', crearRng(1)).dias).toHaveLength(4)
  })
  it('Desde cero arma días vacíos en los días elegidos', () => {
    expect(construirSemana('vacia', crearRng(1)).dias).toEqual([])
    const s = construirSemana('vacia', crearRng(1), [5, 1, 3])
    expect(s.dias.map((d) => d.diaSemana)).toEqual([1, 3, 5])
    s.dias.forEach((d) => expect(d).toMatchObject({ modulos: [], ejercicios: [] }))
  })
  it('Mi rutina actual tiene los ejercicios exactos', () => {
    const d = miRutina()
    expect(d.map((x) => x.diaSemana)).toEqual([1, 2, 4, 5])
    expect(d.map((x) => x.ejercicios.length)).toEqual([5, 8, 6, 7])
    expect(d[1].ejercicios[7]).toMatchObject({ ejercicioId: 'plancha', series: 3, reps: '30 s' })
  })
})

describe('repositorio IndexedDB', () => {
  it('guarda, exporta e importa', async () => {
    const r = crearIdbRepository('test-db')
    await r.saveSemana(construirSemana('mi-rutina', crearRng(1)))
    await r.saveSesion({ id: '2026-01-05_dia-1', fecha: '2026-01-05', diaId: 'dia-1', series: { 'hip-thrust-maquina': [{ hecha: true, peso: 80, reps: 10 }] }, inicio: 1 })
    const backup = await r.exportar()
    await r.borrarTodo()
    expect(await r.getSemana()).toBeNull()
    await r.importar(backup)
    expect((await r.getSemana())?.dias).toHaveLength(4)
    expect((await r.listSesiones())[0].series['hip-thrust-maquina'][0].peso).toBe(80)
    await expect(r.importar({ nope: 1 } as never)).rejects.toThrow()
  })
})
