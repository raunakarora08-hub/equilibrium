import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './changepay.css'
import Deck from './Deck.jsx'

createRoot(document.getElementById('cp-root')).render(
  <StrictMode>
    <Deck />
  </StrictMode>,
)
