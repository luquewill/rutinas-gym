# Rutinas Gym

App web de rutinas de gimnasio, mobile-first e instalable en el celu (PWA). Español de Argentina.
Armás tu semana, la app te recomienda ejercicios, y en el gimnasio marcás series, anotás pesos y usás el temporizador de descanso.

**Stack:** Vite + React + TypeScript + Tailwind + vite-plugin-pwa · datos en IndexedDB · tests con Vitest.

## Correrla

```bash
npm install
npm run dev        # http://localhost:5173 (también accesible desde tu celu en la misma wifi)
npm test           # tests de la lógica de rutinas y la capa de datos
npm run build      # build de producción en dist/
npm run preview    # sirve el build para probar la PWA
```

Para probarla en el celular sin deployar: corré `npm run dev`, abrí en el celu la dirección `Network` que muestra Vite (misma wifi). La instalación como PWA exige HTTPS, así que eso se prueba en la versión publicada.

## Estructura

```
src/
  data/            capa de datos (separada de la UI)
    types.ts         modelos
    repository.ts    interfaz Repository (el contrato)
    idb.ts           implementación IndexedDB
    index.ts         único lugar donde se elige la implementación
    templates.ts     plantillas opcionales (Desde cero, 3 días, 4 días, Rutina de ejemplo)
    exercises.json   biblioteca (94 ejercicios)
  lib/
    routine.ts       lógica pura: recomendar, reemplazar, límites, avisos  (tests: routine.test.ts)
    semana.ts        día de hoy, reasignar días, último peso
    catalog.ts       módulos, músculos, buscador sin tildes
    flags.ts         ADS_ENABLED / CUENTAS_ENABLED / COMPARTIR_ENABLED (futuro)
    compartir.ts     base para rutinas compartibles por link (futuro)
  screens/ components/   UI
scripts/             videos-faltantes, procesar-video (ffmpeg), generadores
```

### Pasar a Supabase más adelante
La UI solo habla con `repo` (`src/data/index.ts`), que cumple la interfaz `Repository`. Para migrar: crear `supabaseRepository.ts` que implemente esa interfaz y cambiar el export en `src/data/index.ts`. Sumar cuentas = activar `CUENTAS_ENABLED` y pasar el `userId` al repositorio.

### Ya preparado para el futuro (no implementado)
- **Publicidad:** `EspacioAnuncio` reserva el lugar del banner en Ejercicios (biblioteca) y en "Día terminado". Está oculto; se activa con `ADS_ENABLED = true` en `src/lib/flags.ts`.
- **Rutinas compartibles por link:** `src/lib/compartir.ts` ya serializa/deserializa una semana a un texto para el hash de la URL.
- **Cuentas:** ver sección de Supabase.

## Agregar videos

Cada ejercicio espera dos archivos en `public/media/ejercicios/`:

- `{id}.mp4` — unos 4 segundos, sin audio
- `{id}.jpg` — poster

El `id` es el de `src/data/exercises.json` (por ejemplo `hip-thrust-maquina`). Si no hay video, la app muestra "Video próximamente".

1. Ver qué falta:
   ```bash
   npm run media:faltantes
   ```
2. Procesar una grabación (necesita [ffmpeg](https://ffmpeg.org/download.html): `winget install ffmpeg` en Windows, `brew install ffmpeg` en Mac). Recorta a 4 s, saca el audio, comprime (máx. 720 px de ancho) y genera el poster:
   ```bash
   npm run media:procesar -- C:\videos\grabacion.mov hip-thrust-maquina
   npm run media:procesar -- C:\videos\grabacion.mov hip-thrust-maquina 2.5   # arrancar en el segundo 2,5
   ```
3. O procesar una carpeta entera, con los archivos nombrados como el id (`hip-thrust-maquina.mov`):
   ```bash
   npm run media:procesar -- --carpeta C:\videos\originales
   ```
4. Commit y push: el deploy sube los videos solos. Una vez cargados, quedan cacheados en el celu para usarlos sin señal.

Para agregar o editar ejercicios, modificá `src/data/exercises.json` (o `scripts/gen-exercises.mjs` y corré `node scripts/gen-exercises.mjs`, que regenera el JSON).

## Deployar en GitHub Pages

El workflow `.github/workflows/deploy.yml` corre los tests, hace el build y publica en cada push a `main`.

1. Crear un repo en GitHub y subir este código a la rama `main`.
2. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Cada push a `main` publica en `https://<tu-usuario>.github.io/<nombre-del-repo>/`.

El `base` de Vite se toma del nombre del repo automáticamente (variable `BASE_PATH` en el workflow). Para servirla desde un dominio propio en la raíz, quitá esa variable.

## Instalarla en el celular
- **Android (Chrome):** menú ⋮ → *Instalar app*.
- **iPhone (Safari):** botón Compartir → *Agregar a pantalla de inicio*. (iOS no permite vibración web.)

## Sobre tus datos
Todo se guarda en el dispositivo (IndexedDB). Desde **Hoy → Ajustes** podés exportar e importar un respaldo JSON, que es la forma de pasar tus datos a otro celu. Si borrás los datos del navegador, se pierden: exportá de vez en cuando.
