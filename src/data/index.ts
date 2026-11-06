import { crearIdbRepository } from './idb'
import type { Repository } from './repository'

/** Único punto donde se elige la implementación (IndexedDB hoy, Supabase mañana). */
export const repo: Repository = crearIdbRepository()
export * from './types'
