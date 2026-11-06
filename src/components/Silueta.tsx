import type { Modulo } from '../data/types'
import { MODULO_LABEL } from '../lib/catalog'

interface Zona {
  modulo: Modulo
  nombre: string
  el: 'ellipse' | 'rect'
  p: number[] // ellipse: cx, cy, rx, ry | rect: x, y, w, h, r
}

const e = (modulo: Modulo, nombre: string, cx: number, cy: number, rx: number, ry: number): Zona => ({ modulo, nombre, el: 'ellipse', p: [cx, cy, rx, ry] })
const r = (modulo: Modulo, nombre: string, x: number, y: number, w: number, h: number, rr = 8): Zona => ({ modulo, nombre, el: 'rect', p: [x, y, w, h, rr] })

const FRENTE: Zona[] = [
  e('hombros', 'Hombro izquierdo', 62, 92, 17, 15),
  e('hombros', 'Hombro derecho', 138, 92, 17, 15),
  r('pecho', 'Pecho', 74, 84, 52, 40, 14),
  r('abdominales', 'Abdominales', 82, 128, 36, 62, 10),
  r('brazos', 'Bíceps izquierdo', 40, 108, 18, 44, 9),
  r('brazos', 'Bíceps derecho', 142, 108, 18, 44, 9),
  r('brazos', 'Antebrazo izquierdo', 34, 156, 16, 58, 8),
  r('brazos', 'Antebrazo derecho', 150, 156, 16, 58, 8),
  r('piernas', 'Cuádriceps izquierdo', 70, 216, 28, 92, 13),
  r('piernas', 'Cuádriceps derecho', 102, 216, 28, 92, 13),
  r('piernas', 'Pantorrilla izquierda', 73, 314, 22, 70, 10),
  r('piernas', 'Pantorrilla derecha', 105, 314, 22, 70, 10),
]

const ESPALDA: Zona[] = [
  e('hombros', 'Hombro izquierdo', 62, 92, 17, 15),
  e('hombros', 'Hombro derecho', 138, 92, 17, 15),
  r('espalda', 'Espalda', 74, 84, 52, 68, 14),
  r('espalda', 'Zona lumbar', 84, 154, 32, 24, 8),
  r('brazos', 'Tríceps izquierdo', 40, 108, 18, 44, 9),
  r('brazos', 'Tríceps derecho', 142, 108, 18, 44, 9),
  r('brazos', 'Antebrazo izquierdo', 34, 156, 16, 58, 8),
  r('brazos', 'Antebrazo derecho', 150, 156, 16, 58, 8),
  e('gluteos', 'Glúteo izquierdo', 86, 200, 19, 21),
  e('gluteos', 'Glúteo derecho', 114, 200, 19, 21),
  r('piernas', 'Isquios izquierdo', 70, 226, 28, 82, 13),
  r('piernas', 'Isquios derecho', 102, 226, 28, 82, 13),
  r('piernas', 'Pantorrilla izquierda', 73, 314, 22, 70, 10),
  r('piernas', 'Pantorrilla derecha', 105, 314, 22, 70, 10),
]

function Figura({ zonas, titulo, seleccion, onToggle }: { zonas: Zona[]; titulo: string; seleccion: Modulo[]; onToggle: (m: Modulo) => void }) {
  return (
    <div className="flex-1">
      <div className="mb-1 text-center font-display text-sm text-mute">{titulo}</div>
      <svg viewBox="0 0 200 400" className="mx-auto h-auto w-full max-w-[190px]" role="group" aria-label={`Silueta ${titulo}`}>
        {/* cuerpo base */}
        <g fill="#1d1d1d" stroke="#2a2a2a" strokeWidth="1.5">
          <circle cx="100" cy="40" r="22" />
          <rect x="92" y="58" width="16" height="24" rx="5" />
          <rect x="64" y="78" width="72" height="116" rx="22" />
          <rect x="68" y="188" width="64" height="40" rx="14" />
        </g>
        {zonas.map((z, i) => {
          const on = seleccion.includes(z.modulo)
          const common = {
            fill: on ? '#FF6B00' : '#2f2f2f',
            stroke: on ? '#ff9a4d' : '#444',
            strokeWidth: 1.5,
            className: 'cursor-pointer transition-colors',
            onClick: () => onToggle(z.modulo),
            role: 'button' as const,
            'aria-pressed': on,
            'aria-label': `${z.nombre} (${MODULO_LABEL[z.modulo]})`,
          }
          return z.el === 'ellipse' ? (
            <ellipse key={i} cx={z.p[0]} cy={z.p[1]} rx={z.p[2]} ry={z.p[3]} {...common} />
          ) : (
            <rect key={i} x={z.p[0]} y={z.p[1]} width={z.p[2]} height={z.p[3]} rx={z.p[4]} {...common} />
          )
        })}
      </svg>
    </div>
  )
}

export function Silueta({ seleccion, onToggle }: { seleccion: Modulo[]; onToggle: (m: Modulo) => void }) {
  return (
    <div className="flex gap-2">
      <Figura zonas={FRENTE} titulo="Frente" seleccion={seleccion} onToggle={onToggle} />
      <Figura zonas={ESPALDA} titulo="Espalda" seleccion={seleccion} onToggle={onToggle} />
    </div>
  )
}
