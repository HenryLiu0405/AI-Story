import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { StoreProvider } from './context/StoreContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
      <App />
      <Toaster position="top-right" />
    </StoreProvider>
  </React.StrictMode>,
)
