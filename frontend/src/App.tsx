import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Room } from './Room'
import { Home } from './Home'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />}></Route>
          <Route path='/room' element={<Room />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
