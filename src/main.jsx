import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
import './App.css'
import './academy/academy.css'
import App from './App.jsx'
import ApiDocs from './ApiDocs.jsx'

const isApiDocs = window.location.pathname === '/api-docs'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isApiDocs ? <ApiDocs /> : <App />}
  </StrictMode>,
)
