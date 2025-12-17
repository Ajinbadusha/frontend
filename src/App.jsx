import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CrawlingProgress from './pages/CrawlingProgress'
import Results from './pages/Results'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/crawling" element={<CrawlingProgress />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Router>
  )
}

export default App
