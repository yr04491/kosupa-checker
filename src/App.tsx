import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TopPage from './pages/TopPage';
import MenuPage from './pages/MenuPage';
import ResultPage from './pages/ResultPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TopPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/result/:sessionId" element={<ResultPage />} />
      </Routes>
    </BrowserRouter>
  );
}
