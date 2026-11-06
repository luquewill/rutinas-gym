// Recorta a ~4 s, comprime a MP4 sin audio y genera el poster (.jpg) con ffmpeg.
//
// Un video:     npm run media:procesar -- ruta/grabacion.mov hip-thrust-maquina [segundoInicio]
// Una carpeta:  npm run media:procesar -- --carpeta ruta/originales
//               (cada archivo se tiene que llamar como el id del ejercicio: hip-thrust-maquina.mov)
//
// Requiere ffmpeg instalado y en el PATH: https://ffmpeg.org/download.html
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const salida = join(raiz, 'public/media/ejercicios')
const ids = new Set(JSON.parse(readFileSync(join(raiz, 'src/data/exercises.json'), 'utf8')).map((e) => e.id))
const DURACION = 4

if (spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status !== 0) {
  console.error('No encontré ffmpeg. Instalalo (Windows: winget install ffmpeg · Mac: brew install ffmpeg) y reintentá.')
  process.exit(1)
}
mkdirSync(salida, { recursive: true })

function procesar(entrada, id, inicio = '0') {
  if (!ids.has(id)) {
    console.error(`✗ "${id}" no es un id de ejercicio válido (ver src/data/exercises.json). Salteado.`)
    return false
  }
  const mp4 = join(salida, `${id}.mp4`)
  const jpg = join(salida, `${id}.jpg`)
  // Video: 4 s, sin audio, máx. 720 px de ancho, H.264 liviano, listo para streaming.
  const v = spawnSync('ffmpeg', ['-y', '-ss', String(inicio), '-t', String(DURACION), '-i', entrada, '-an',
    '-vf', "scale='min(720,iw)':-2", '-c:v', 'libx264', '-preset', 'slow', '-crf', '28',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { stdio: 'inherit' })
  if (v.status !== 0) return console.error(`✗ Falló el video de ${id}`), false
  // Poster: un cuadro a los 1,5 s del video ya recortado.
  const p = spawnSync('ffmpeg', ['-y', '-ss', '1.5', '-i', mp4, '-frames:v', '1', '-q:v', '4', jpg], { stdio: 'inherit' })
  if (p.status !== 0) return console.error(`✗ Falló el poster de ${id}`), false
  console.log(`✓ ${id}: ${(statSync(mp4).size / 1024).toFixed(0)} KB`)
  return true
}

const args = process.argv.slice(2)
if (args[0] === '--carpeta' && args[1]) {
  const dir = resolve(args[1])
  let ok = 0, total = 0
  for (const f of readdirSync(dir)) {
    if (!/\.(mp4|mov|m4v|webm|mkv)$/i.test(f)) continue
    total++
    if (procesar(join(dir, f), basename(f, extname(f)))) ok++
  }
  console.log(`\n${ok}/${total} videos procesados.`)
} else if (args.length >= 2 && existsSync(args[0])) {
  process.exit(procesar(resolve(args[0]), args[1], args[2]) ? 0 : 1)
} else {
  console.log('Uso:\n  npm run media:procesar -- <video> <id-ejercicio> [segundoInicio]\n  npm run media:procesar -- --carpeta <carpeta>')
  process.exit(1)
}
