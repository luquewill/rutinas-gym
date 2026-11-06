import { useEffect, type ReactNode } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { ADS_ENABLED } from '../lib/flags'

export function Encabezado({ titulo, subtitulo, onVolver, derecha }: { titulo: string; subtitulo?: string; onVolver?: () => void; derecha?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-bg/95 px-4 py-3 backdrop-blur">
      {onVolver && (
        <button className="btn-ghost !min-h-[44px] !w-11 !px-0" onClick={onVolver} aria-label="Volver">
          <ArrowLeft size={20} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl leading-none">{titulo}</h1>
        {subtitulo && <p className="mt-0.5 truncate text-sm text-mute">{subtitulo}</p>}
      </div>
      {derecha && <div className="flex gap-2">{derecha}</div>}
    </header>
  )
}

export function Hoja({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', k)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', k)
      document.body.style.overflow = ''
    }
  }, [onCerrar])
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/70 sm:items-center sm:justify-center" onClick={onCerrar}>
      <div
        className="safe-bottom mx-auto flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl border border-line bg-bg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={titulo}
      >
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <h2 className="text-2xl">{titulo}</h2>
          <button className="btn-ghost !w-11 !px-0" onClick={onCerrar} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
      </div>
    </div>
  )
}

/** Espacio reservado para un banner (versión gratis con publicidad). Oculto hasta activar ADS_ENABLED. */
export function EspacioAnuncio({ ubicacion }: { ubicacion: 'biblioteca' | 'dia-terminado' }) {
  if (!ADS_ENABLED) return null
  return (
    <div data-ad-slot={ubicacion} className="flex h-[60px] items-center justify-center rounded-xl border border-dashed border-line text-xs text-mute">
      Publicidad
    </div>
  )
}

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'error'; children: ReactNode }) {
  return (
    <div
      role={tipo === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-3 py-2 text-sm ${tipo === 'error' ? 'border-accent bg-accent/10 text-white' : 'border-line bg-card text-mute'}`}
    >
      {children}
    </div>
  )
}
