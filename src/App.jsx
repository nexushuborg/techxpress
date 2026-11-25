import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Lenis from 'lenis';
import TrainScene from './components/TrainScene';
import InteriorScene from './components/InteriorScene';
import AboutPage from './components/content/AboutPage';
import RegisterPage from './components/content/RegisterPage';
import TimelinePage from './components/content/TimelinePage';

export default function App() {
  const navigate = useNavigate();
  const [journeyStage, setJourneyStage] = useState('station');

  useEffect(() => {
    // Initialize Lenis for smooth momentum scrolling
    const lenis = new Lenis({
      autoRaf: true,
    });

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="App">
      <Routes>
        {/* The Cinematic Journey (Root) */}
        <Route path="/" element={
          journeyStage === 'station' ? (
            <TrainScene onComplete={() => setJourneyStage('interior')} />
          ) : (
            <InteriorScene onNavigate={(path) => navigate(`/${path}`)} />
          )
        } />

        {/* Destination Content Pages */}
        <Route path="/about" element={<AboutPage onBack={() => navigate('/')} />} />
        <Route path="/register" element={<RegisterPage onBack={() => navigate('/')} />} />
        <Route path="/timeline" element={<TimelinePage onBack={() => navigate('/')} />} />
      </Routes>
    </div>
  );
}
