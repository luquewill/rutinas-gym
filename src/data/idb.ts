import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Ajustes, BackupV1, Semana, SesionRegistro } from './types'
import { AJUSTES_DEFAULT, validarBackup, type Repository } from './repository'

interface Schema extends DBSchema {
  kv: { key: string; value: unknown }
  sesiones: { key: string; value: SesionRegistro }
}

export function crearIdbRepository(nombre = 'rutinas-gym'): Repository {
  let dbp: Promise<IDBPDatabase<Schema>> | null = null
  const db = () =>
    (dbp ??= openDB<Schema>(nombre, 1, {
      upgrade(d) {
        d.createObjectStore('kv')
        d.createObjectStore('sesiones', { keyPath: 'id' })
      },
    }))

  const repo: Repository = {
    async getSemana() {
      return ((await (await db()).get('kv', 'semana')) as Semana | undefined) ?? null
    },
    async saveSemana(s) {
      await (await db()).put('kv', s, 'semana')
    },
    async getAjustes() {
      const a = (await (await db()).get('kv', 'ajustes')) as Ajustes | undefined
      return { ...AJUSTES_DEFAULT, ...a }
    },
    async saveAjustes(a) {
      await (await db()).put('kv', a, 'ajustes')
    },
    async getSesion(id) {
      return (await db()).get('sesiones', id)
    },
    async saveSesion(s) {
      await (await db()).put('sesiones', s)
    },
    async listSesiones() {
      const all = await (await db()).getAll('sesiones')
      return all.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.inicio - a.inicio)
    },
    async exportar(): Promise<BackupV1> {
      return {
        version: 1,
        exportadoEn: new Date().toISOString(),
        semana: await repo.getSemana(),
        sesiones: await repo.listSesiones(),
        ajustes: await repo.getAjustes(),
      }
    },
    async importar(raw) {
      const b = validarBackup(raw)
      await repo.borrarTodo()
      if (b.semana) await repo.saveSemana(b.semana)
      await repo.saveAjustes({ ...AJUSTES_DEFAULT, ...b.ajustes })
      for (const s of b.sesiones) await repo.saveSesion(s)
    },
    async borrarTodo() {
      const d = await db()
      await d.clear('kv')
      await d.clear('sesiones')
    },
  }
  return repo
}
