import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./InteriorScene.css";
import SeatNavigation from "./SeatNavigation";

const ASSETS = {
  video: "/assets/train_bg.mp4",
  mask: "/assets/train_interior_pov_masked1.png",
};

export default function InteriorScene({ onNavigate }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const revealRef = useRef(null);

  const [isAssetsReady, setIsAssetsReady] = useState(false);
  const loadCount = useRef(0);
  const TOTAL_ASSETS = 2; // Background video & foreground interior mask

  const handleLoaded = () => {
    loadCount.current += 1;
    if (loadCount.current >= TOTAL_ASSETS) {
      setIsAssetsReady(true);
    }
  };

  useEffect(() => {
    // Reveal animation once train interior assets are fully ready
    if (isAssetsReady && revealRef.current) {
      gsap.to(revealRef.current, {
        opacity: 0,
        duration: 0.55,
        ease: "power2.inOut",
        delay: 0.1,
      });
    }
  }, [isAssetsReady]);

  return (
    <div className="interior-scene" ref={containerRef}>
      {/* 1. Background Video Layer (Train window scenery in motion) */}
      <div className="interior-video-container">
        <video
          ref={videoRef}
          src={ASSETS.video}
          autoPlay
          muted
          loop
          playsInline
          className="interior-video"
          onCanPlayThrough={handleLoaded}
        />
      </div>

      {/* 2. Foreground Mask Layer (Train interior, seats, ceiling, windows) */}
      <div className="interior-mask-container">
        <img
          src={ASSETS.mask}
          alt="Train Interior Mask"
          className="interior-mask"
          onLoad={handleLoaded}
          onError={handleLoaded}
        />
      </div>

      {/* 3. Initial Reveal Overlay (Blackout lifts on arrival) */}
      <div className="interior-reveal-overlay" ref={revealRef} />

      {/* 4. Seat Screen Navigation Layout (Always accessible without popup interruptions) */}
      <SeatNavigation isVisible={isAssetsReady} onNavigate={onNavigate} />
    </div>
  );
}
