import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './deck.css'
import Deck from './Deck.jsx'

createRoot(document.getElementById('deck-root')).render(
  <StrictMode>
    <Deck />
  </StrictMode>,
)
