import type { Semana } from '../data/types'

/**
 * Estructura lista para "rutinas compartibles por link" (no está activa en la UI).
 * Idea: serializar la semana (sin registros) a base64url y ponerla en el hash: #/r/<payload>.
 * Cuando haya cuentas, el payload puede reemplazarse por un id de Supabase.
 */
export function codificarRutina(s: Semana): string {
  const json = JSON.stringify({ v: 1, plantilla: s.plantilla, dias: s.dias })
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodificarRutina(payload: string): Semana {
  const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
  const o = JSON.parse(decodeURIComponent(escape(atob(b64))))
  if (o.v !== 1 || !Array.isArray(o.dias)) throw new Error('Link de rutina inválido')
  return { id: 'activa', plantilla: o.plantilla ?? 'compartida', dias: o.dias }
}
