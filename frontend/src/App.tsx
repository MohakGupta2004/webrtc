import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Sender } from './Sender'
import { Receiver } from './Receiver'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/sender' element={<Sender />}></Route>
          <Route path='/receiver' element={<Receiver />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
