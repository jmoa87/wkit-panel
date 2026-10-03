# Wkit — panel web de territorios

Panel para que los siervos de territorios de cada congregación creen y
gestionen sus territorios sobre un mapa: sectores (con colores y orden
propio), territorios (dibujados punto a punto), y su reparto entre los
hermanos.

## Cómo se entra

No hay usuario ni contraseña. Cada siervo de territorios recibe, desde
la app Wkit (ficha del hermano → *Acceso al panel de territorios*), un
enlace con su clave:

```
https://USUARIO.github.io/wkit-panel/?clave=XXXXXXXX
```

La clave la comprueba Supabase en cada petición: decide de qué
congregación es y si tiene permiso de territorios. Sin clave (o con una
clave inválida) el panel solo enseña un aviso.

## Datos

Todo vive en Supabase (el mismo proyecto que usa la app de iOS), así que
lo que se asigna aquí se ve en la app y al revés. Las funciones que usa
el panel están en `wkit-supabase/04`, `06` y `08` (`panel_*`).

La URL y la clave pública de Supabase están en `src/api/client.ts`. Esa
clave es pública por diseño: la seguridad está en las reglas de acceso
de Supabase, no en esconderla.

## Probar en local

Necesitas Node.js 18 o superior:

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173/?clave=XXXXXXXX`.

## Publicar (GitHub Pages)

Cada vez que se sube algo a la rama `main`, el flujo
`.github/workflows/deploy.yml` construye el panel y lo publica solo.

Pasos la primera vez:

1. Crear el repositorio (público) y subir esta carpeta.
2. En GitHub: *Settings → Pages → Build and deployment → Source:
   GitHub Actions*.
3. En la pestaña *Actions*, volver a lanzar "Publicar el panel" si el
   primer intento falló por no tener Pages activado todavía.

Antes de subir, conviene comprobar en local que construye:

```bash
npm run build
```

## Pendiente

- Gestión de campañas desde el panel (hoy solo desde la app).
- Historial de asignaciones, para rellenar las 4 columnas del S-13.
