import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './Home.tsx'
import Room from './Room.tsx'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />}></Route>
          <Route path='/room/:id' element={<Room />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
