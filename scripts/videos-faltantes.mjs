// Lista qué ejercicios todavía no tienen video (y/o poster).
// Uso: npm run media:faltantes
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const ejercicios = JSON.parse(readFileSync(join(raiz, 'src/data/exercises.json'), 'utf8'))
const dir = join(raiz, 'public/media/ejercicios')

const faltan = []
for (const e of ejercicios) {
  const v = existsSync(join(dir, `${e.id}.mp4`))
  const p = existsSync(join(dir, `${e.id}.jpg`))
  if (!v || !p) faltan.push({ ...e, v, p })
}

const porModulo = {}
for (const e of faltan) (porModulo[e.modulo] ??= []).push(e)

for (const [modulo, lista] of Object.entries(porModulo)) {
  console.log(`\n== ${modulo.toUpperCase()} (${lista.length}) ==`)
  for (const e of lista) {
    const que = !e.v && !e.p ? 'video + poster' : !e.v ? 'solo falta el video' : 'solo falta el poster'
    console.log(`  ${e.id.padEnd(34)} ${e.nombre}  [${que}]`)
  }
}
const listos = ejercicios.length - faltan.length
console.log(`\n${listos}/${ejercicios.length} ejercicios con video y poster. Faltan ${faltan.length}.`)
