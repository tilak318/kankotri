import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import TemplateForm from './TemplateForm.tsx'
import Header from './Header.tsx' // Import the new Header component

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Header /> {/* Render the Header component here */}
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/template/:template" element={<TemplateForm />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)


