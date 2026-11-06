import { useEffect, useRef, useState } from 'react'
import { Film } from 'lucide-react'
import type { Ejercicio } from '../data/types'

const url = (p: string) => `${import.meta.env.BASE_URL}${p}`

function Placeholder({ grande }: { grande?: boolean }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#101010] text-mute">
      <Film size={grande ? 34 : 18} />
      <span className={grande ? 'text-sm' : 'text-[10px] leading-tight'}>Video próximamente</span>
    </div>
  )
}

/**
 * Video corto (autoplay, muted, loop, playsinline) con carga diferida:
 * no pide nada hasta que entra en pantalla. Si falta el archivo, muestra un placeholder.
 */
export function Media({ ejercicio, grande = false, className = '' }: { ejercicio: Ejercicio; grande?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    setError(false)
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      ([en]) => {
        if (en.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ejercicio.id])

  return (
    <div ref={ref} className={`relative overflow-hidden bg-[#101010] ${className}`}>
      {error || !visible ? (
        error ? <Placeholder grande={grande} /> : null
      ) : (
        <video
          key={ejercicio.id}
          className="h-full w-full object-cover"
          src={url(ejercicio.media.video)}
          poster={url(ejercicio.media.poster)}
          autoPlay
          muted
          loop
          playsInline
          preload={grande ? 'auto' : 'metadata'}
          onError={() => setError(true)}
          aria-label={`Video de ${ejercicio.nombre}`}
        />
      )}
    </div>
  )
}
