
import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from './homepage/homepage';
import { Toaster } from 'react-hot-toast';

function App() {


  return (

   

    <Router>

<Toaster position='top-right'/>
      <Routes>
        <Route path="/" element={<HomePage />} />

      </Routes>


    </Router>

  )
}

export default App
