import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Register from './pages/Register'
import Verify from './pages/Verify'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Register />} />
        <Route path="/verify/:id" element={<Verify />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App