import type { Ajustes, BackupV1, Semana, SesionRegistro } from './types'

/**
 * Contrato de la capa de datos. Hoy lo implementa IndexedDB (idb.ts).
 * Para pasar a Supabase: crear supabaseRepository.ts que implemente esta interfaz
 * y cambiar el export en src/data/index.ts. La UI no toca la base directamente.
 */
export interface Repository {
  getSemana(): Promise<Semana | null>
  saveSemana(s: Semana): Promise<void>
  getAjustes(): Promise<Ajustes>
  saveAjustes(a: Ajustes): Promise<void>
  getSesion(id: string): Promise<SesionRegistro | undefined>
  saveSesion(s: SesionRegistro): Promise<void>
  listSesiones(): Promise<SesionRegistro[]>
  exportar(): Promise<BackupV1>
  importar(b: BackupV1): Promise<void>
  borrarTodo(): Promise<void>
}

export const AJUSTES_DEFAULT: Ajustes = { descansoDefault: 90, vibracion: true, diasEntreno: [1, 2, 4, 5] }

export function validarBackup(x: unknown): BackupV1 {
  const b = x as Partial<BackupV1>
  if (!b || typeof b !== 'object' || b.version !== 1 || !Array.isArray(b.sesiones) || !b.ajustes) {
    throw new Error('El archivo no es un respaldo válido de Rutina+.')
  }
  return b as BackupV1
}
