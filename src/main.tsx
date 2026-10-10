import { createRoot } from 'react-dom/client'
import App from './App'
import { SelectorIdioma } from './i18n'
import './styles/tokens.css'
import './styles/global.css'

// Nota: sin <StrictMode>. MapLibre crea un contexto WebGL sobre el
// elemento del mapa; el doble montaje que StrictMode hace a propósito
// en desarrollo (montar → desmontar → montar) rompe ese contexto antes
// de que termine de cargar el estilo. Es una limitación conocida de las
// librerías de mapas, no algo que podamos arreglar en nuestro código.
createRoot(document.getElementById('root')!).render(
  <>
    <SelectorIdioma />
    <App />
  </>
)
