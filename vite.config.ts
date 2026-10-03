import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Ruta relativa: así la web funciona igual en cualquier dirección
  // (https://usuario.github.io/wkit-panel/, un dominio propio...) sin
  // tener que tocar nada al cambiar de sitio.
  base: './',
})
