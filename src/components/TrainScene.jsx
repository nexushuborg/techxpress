import { useRef, useState, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './TrainScene.css';

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────
   Image analysis constants (measured from PNGs)
   ───────────────────────────────────────────── */
const TRAIN_NATURAL_W = 1629;
const TRAIN_NATURAL_H = 543;

// Door center in the closed train PNG (px from top-left of image)
const DOOR_CENTER_X_PX = 796;
const DOOR_CENTER_Y_PX = 250;

// Ratios for dynamic computation
const DOOR_X_RATIO = DOOR_CENTER_X_PX / TRAIN_NATURAL_W; // ≈ 0.325
const DOOR_Y_RATIO = DOOR_CENTER_Y_PX / TRAIN_NATURAL_H; // ≈ 0.460

// Background: the platform edge (top of red brick wall) sits at ~62% of image height
const PLATFORM_Y_PERCENT = 0.62;

// --- GLOBAL SCALE & POSITIONING (Now handled dynamically) ---

/* ─────────────────────────────────────────────
   Asset paths (relative to public/)
   ───────────────────────────────────────────── */
const ASSETS = {
  background: '/assets/background2.png',
  tracks: '/assets/track_wbg.png',
  trainClosed: '/assets/train_long_closed_wbg.png',
  trainOpen: '/assets/train_long_open_wbg.png',
  platform: '/assets/platform_wbg.png',
  ttMaster: '/assets/TT_master_wbg.png',
  cloud: '/assets/cloud_wbg.png',
};

const STATION_MASTER_DIALOGUE = [
  {
    text: "Hi! I am Rajesh Sharma, your station master.\nWelcome to the TechXpress journey!"
  }
];

/* ─────────────────────────────────────────────
   Component
   ───────────────────────────────────────────── */
import StationMaster from './StationMaster';

export default function TrainScene({ onComplete }) {
  const spacerRef = useRef(null);
  const sceneRef = useRef(null);
  const masterContainerRef = useRef(null); // Container for global zoom
  const tracksRef = useRef(null);
  const trainClosedRef = useRef(null);
  const trainOpenRef = useRef(null);
  const platformRef = useRef(null); // Added ref for platform blur
  const blackoutRef = useRef(null);
  const backgroundSharpRef = useRef(null); // Base sharp layer
  const backgroundBlurRef = useRef(null); // Blurred layer for performance
  const pivotMarkerRef = useRef(null); // Added ref for visual debugging

  // Dialogue & Navigation state
  const [dialogueStep, setDialogueStep] = useState(0); // 0: hidden, 1: showing, 2: finished
  const [showInstruction, setShowInstruction] = useState(false);
  const isNavigatingRef = useRef(false);
  const completeTriggeredRef = useRef(false);
  const hasArrivedRef = useRef(false);

  // Responsive Viewport Tracking (Resize & Orientation)
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    let resizeTimer = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!isNavigatingRef.current) {
          setWindowDimensions({
            width: window.innerWidth,
            height: window.innerHeight,
          });
          ScrollTrigger.refresh();
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Store GSAP objects for cleanup
  const tlRef = useRef(null);
  const stRef = useRef(null);

  /* loading gate */
  const [loaded, setLoaded] = useState(false);
  const loadCount = useRef(0);
  const TOTAL_IMAGES = 8; // BG-sharp, BG-blur, tracks, train-closed, train-open, platform, ttMaster, cloud

  const handleImgReady = useCallback(() => {
    loadCount.current += 1;
    if (loadCount.current >= TOTAL_IMAGES) {
      setLoaded(true);
    }
  }, []);

  /* ── Defer non-essential interior assets: preload in background AFTER landing is ready ── */
  useEffect(() => {
    if (!loaded) return;
    const idleTimer = setTimeout(() => {
      const img = new Image();
      img.src = '/assets/train_interior_pov_masked1.png';
      const video = document.createElement('video');
      video.src = '/assets/train_bg.mp4';
      video.preload = 'auto';
    }, 800);
    return () => clearTimeout(idleTimer);
  }, [loaded]);

  /* ── Smooth Navigation to Train Interior ── */
  const triggerEnterTrain = useCallback(() => {
    if (isNavigatingRef.current || completeTriggeredRef.current) return;
    isNavigatingRef.current = true;

    // Fade out instruction immediately
    setShowInstruction(false);

    // Dismiss dialogue if still active
    setDialogueStep(2);

    const scrollTl = tlRef.current?.scrollTl;
    if (!scrollTl) {
      if (!completeTriggeredRef.current && onComplete) {
        completeTriggeredRef.current = true;
        onComplete();
      }
      return;
    }

    // Disable ScrollTrigger scrubbing so manual scroll doesn't conflict
    if (stRef.current) {
      stRef.current.disable(false);
    }

    const currentProgress = scrollTl.progress();
    const remaining = 1 - currentProgress;
    const duration = Math.max(0.65, 1.5 * remaining);

    gsap.to(scrollTl, {
      progress: 1,
      duration,
      ease: 'power2.inOut',
      onComplete: () => {
        if (!completeTriggeredRef.current && onComplete) {
          completeTriggeredRef.current = true;
          window.scrollTo(0, 0);
          setTimeout(onComplete, 120);
        }
      }
    });
  }, [onComplete]);

  /* ── Double-Click (Desktop) & Double-Tap (Mobile) Listeners ── */
  useEffect(() => {
    if (!loaded) return;

    // Desktop double click
    const handleDblClick = (e) => {
      if (e.target.tagName === 'INPUT') return;
      triggerEnterTrain();
    };

    // Mobile double tap tracking
    const touchStartPos = { x: 0, y: 0, time: 0 };
    const lastTap = { x: 0, y: 0, time: 0 };

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartPos.x = e.touches[0].clientX;
        touchStartPos.y = e.touches[0].clientY;
        touchStartPos.time = Date.now();
      }
    };

    const handleTouchEnd = (e) => {
      if (e.changedTouches.length !== 1) return;
      if (e.target.tagName === 'INPUT') return;

      const touch = e.changedTouches[0];
      const moveDist = Math.hypot(touch.clientX - touchStartPos.x, touch.clientY - touchStartPos.y);

      // Distinguish tap from swipe / manual scroll (> 15px is a scroll)
      if (moveDist > 15) return;

      const now = Date.now();
      const timeSinceLastTap = now - lastTap.time;
      const tapDist = Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y);

      if (timeSinceLastTap > 40 && timeSinceLastTap < 350 && tapDist < 35) {
        // Confirmed double-tap
        lastTap.time = 0;
        triggerEnterTrain();
      } else {
        lastTap.x = touch.clientX;
        lastTap.y = touch.clientY;
        lastTap.time = now;
      }
    };

    window.addEventListener('dblclick', handleDblClick);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('dblclick', handleDblClick);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [loaded, triggerEnterTrain]);

  /* ── Build animation after images load ── */
  useEffect(() => {
    if (!loaded) return;

    const tracksImg = tracksRef.current;
    const closedImg = trainClosedRef.current;
    const openImg = trainOpenRef.current;
    const blackout = blackoutRef.current;
    const spacer = spacerRef.current;
    const masterContainer = masterContainerRef.current;
    const platform = platformRef.current;

    if (!tracksImg || !closedImg || !openImg || !blackout || !spacer || !masterContainer) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const isMobile = vw <= 768;

    /* ── Responsive Constants ── */
    const baseScale = isMobile ? 2.1 : 2.6;
    const zoomScaleFactor = isMobile ? 12 : 8;
    // Nudge the door centering: Set to 0 to align exactly with the center red line
    const doorCenterNudge = 0;

    /* ── Set initial positions via GSAP (not CSS) ── */

    /* ── Compute dimensions of the visible train ── */
    const renderedTrainW = openImg.offsetWidth;
    const renderedTrainH = openImg.offsetHeight;

    // Starting X: Pushed way left to account for large scale
    const startingX = -renderedTrainW * baseScale - 500;

    /* ── Transform origin for the zoom (relative to the img element) ── */
    const originX = DOOR_X_RATIO * renderedTrainW;
    const originY = DOOR_Y_RATIO * renderedTrainH;
    const originStr = `${originX}px ${originY}px`;

    // --- DOOR CENTERING & ZOOM PIVOT ---
    // Zoom origin is FIXED at the middle of the screen (the red line)
    const pivotX = vw / 2;
    const pivotY = vh * 0.45;

    // The point where we want the door to stop (Pivot + Nudge)
    const targetDoorX = pivotX + doorCenterNudge;

    // The train's X position needed to align its door with targetDoorX
    const trainFinalX = targetDoorX - originX;

    console.log('--- SYNC DEBUG ---', {
      pivotX,
      trainFinalX,
      originX,
      isMobile
    });

    // Reset positions
    gsap.set(tracksImg, { x: 0 });
    gsap.set(closedImg, { opacity: 0 });
    gsap.set(blackout, { opacity: 0 });
    gsap.set(masterContainer, { scale: 1, x: 0, y: 0 });

    let trainEntry = null;

    if (hasArrivedRef.current) {
      // Train has already arrived: maintain docked alignment at newly calculated responsive coordinates
      gsap.set(openImg, {
        x: trainFinalX,
        opacity: 1,
        scale: baseScale,
        transformOrigin: originStr
      });
    } else {
      // First arrival animation
      gsap.set(openImg, {
        x: startingX,
        opacity: 1,
        scale: baseScale,
        transformOrigin: originStr
      });

      /* ═══ Auto-play: Arrival (Cinematic, Smooth & Natural) ═══ */
      trainEntry = gsap.timeline({ delay: 0.15 });
      trainEntry.to(openImg, {
        x: trainFinalX,
        ease: 'power3.out',
        duration: 1.8,
        onComplete: () => {
          hasArrivedRef.current = true;
          // Trigger the Station Master arrival gracefully after train halts
          gsap.delayedCall(0.25, () => {
            const skipGuides = window.SKIP_GUIDES === true;
            setDialogueStep(skipGuides ? 2 : 1);
            setShowInstruction(true);
          });
        }
      }, 0);
    }

    /* ═══ Scroll-driven: Boarding ═══ */
    const scrollTl = gsap.timeline({ paused: true });

    // 1. Global Zoom: Pivot EXACTLY on pivotX
    scrollTl.to(masterContainer, {
      scale: zoomScaleFactor,
      y: -20, // subtle "lift" as you step in
      transformOrigin: `${pivotX}px ${pivotY}px`,
      ease: 'power2.inOut',
      duration: 1,
    }, 0);

    // 2. Platform Glide: Move vertically down the screen (KEEP QUALITY)
    // Removed opacity/blur to keep it looking sharp while it slides away
    scrollTl.to(platform, {
      y: vh * 0.8,
      ease: 'power2.in',
      duration: 0.8,
    }, 0);

    // 3. Slow World Fade: Blend into the blurred layer
    scrollTl.to(backgroundBlurRef.current, {
      opacity: 1,
      ease: 'power1.inOut',
      duration: 0.9,
    }, 0.1);

    // Fade out original sharp layer simultaneously
    scrollTl.to(backgroundSharpRef.current, {
      opacity: 0,
      ease: 'power1.inOut',
      duration: 0.8,
    }, 0.2);

    // 4. Entering the train: Final blackout
    scrollTl.to(blackout, {
      opacity: 1,
      ease: 'power2.in',
      duration: 0.15,
    }, 0.85);

    /* ── ScrollTrigger scrubs the zoom timeline ── */
    const st = ScrollTrigger.create({
      trigger: spacer,
      start: 'top top',
      end: 'bottom bottom',
      animation: scrollTl,
      scrub: 1.5, // smoother scrubbing
      onUpdate: (self) => {
        if (self.progress > 0.05 && !isNavigatingRef.current) {
          setShowInstruction(false);
        }
        // Lenis smooth scroll sometimes stops at 0.999 progress
        if (self.progress > 0.99 && !completeTriggeredRef.current && onComplete) {
          completeTriggeredRef.current = true;
          window.scrollTo(0, 0);
          // Short delay for cinematic feel
          setTimeout(onComplete, 200);
        }
      },
    });

    // Positioning the pivot marker (debug only)
    const marker = pivotMarkerRef.current;
    if (marker) {
      gsap.set(marker, { left: pivotX, top: pivotY });
    }

    // Store for cleanup
    tlRef.current = { trainEntry, scrollTl };
    stRef.current = st;

    return () => {
      if (stRef.current) stRef.current.kill();
      if (tlRef.current) {
        tlRef.current.trainEntry?.kill();
        tlRef.current.scrollTl?.kill();
      }
    };
  }, [loaded, onComplete, windowDimensions]); // Re-run when loaded or window size fluctuates

  return (
    <>
      {/* Loading screen */}
      {!loaded && (
        <div className="scene-loading">
          <div className="loading-spinner">Arriving…</div>
        </div>
      )}

      {/* On-Screen Double-Tap Instruction */}
      <div
        className={`enter-instruction ${showInstruction ? 'visible' : 'hidden'}`}
        onDoubleClick={triggerEnterTrain}
        role="button"
        tabIndex={0}
        aria-label="Double tap to enter the train"
      >
        <span className="instruction-badge">
          <span className="instruction-ripple" />
          <span className="instruction-dot" />
        </span>
        <span className="instruction-text">Double Tap to Go Inside the Train</span>
      </div>

      {/* Fixed scene viewport */}
      <div 
        className="train-scene" 
        id="train-scene" 
        ref={sceneRef}
        style={{ touchAction: 'manipulation' }}
      >
        {/* Master container that holds everything for global zoom */}
        <div className="master-container" ref={masterContainerRef}>
          {/* z-0: Background (Sharper default layer) */}
          <div className="scene-layer layer-background layer-background-sharp" ref={backgroundSharpRef}>
            <img
              src={ASSETS.background}
              alt="New Delhi railway station"
              onLoad={handleImgReady}
              onError={handleImgReady}
              draggable={false}
            />
          </div>

          {/* z-0 overlay: Pre-blurred layer for performance optimization */}
          <div className="scene-layer layer-background layer-background-blur" ref={backgroundBlurRef}>
            <img
              src={ASSETS.background}
              alt="Blurred background"
              onLoad={handleImgReady}
              onError={handleImgReady}
              draggable={false}
            />
          </div>

          {/* z-1: Tracks */}
          <div className="scene-layer layer-tracks">
            <img
              ref={tracksRef}
              src={ASSETS.tracks}
              alt="Railway tracks"
              onLoad={handleImgReady}
              onError={handleImgReady}
              draggable={false}
            />
          </div>

          {/* z-2: Train (doors closed) - HIDDEN BY DEFAULT */}
          <div className="scene-layer layer-train">
            <img
              ref={trainClosedRef}
              src={ASSETS.trainClosed}
              alt="TechXpress train — doors closed"
              onLoad={handleImgReady}
              onError={handleImgReady}
              draggable={false}
            />
          </div>

          {/* z-3: Train (doors open) */}
          <div className="scene-layer layer-train layer-train-open">
            <img
              ref={trainOpenRef}
              src={ASSETS.trainOpen}
              alt="TechXpress train — doors open"
              onLoad={handleImgReady}
              onError={handleImgReady}
              draggable={false}
            />
          </div>
        </div>

        {/* z-4: Foreground Platform */}
        <div className="scene-layer layer-platform" ref={platformRef}>
          <img
            src={ASSETS.platform}
            alt="Station platform foreground"
            onLoad={handleImgReady}
            onError={handleImgReady}
            draggable={false}
          />
        </div>

        {/* z-5: Global blackout */}
        <div className="scene-layer layer-blackout" ref={blackoutRef} />

        {/* --- Station Master Guide (Rajesh Sharma) --- */}
        <StationMaster
          isVisible={dialogueStep === 1}
          dialogues={STATION_MASTER_DIALOGUE}
          assets={ASSETS}
          onComplete={() => setDialogueStep(2)}
        />

        {/* Hidden pre-loaders for essential character guide assets */}
        <div style={{ display: 'none' }}>
           <img src={ASSETS.ttMaster} onLoad={handleImgReady} alt="" />
           <img src={ASSETS.cloud} onLoad={handleImgReady} alt="" />
        </div>
      </div>

      {/* Scroll spacer — only active after dialogue is finished */}
      <div
        className="scroll-spacer"
        ref={spacerRef}
        style={{
          height: '400vh',
          pointerEvents: dialogueStep === 1 ? 'none' : 'auto'
        }}
      />

      {/* Visual guide to help with centering - DO NOT REMOVE UNTIL FINAL APPROVAL */}
      <div className="center-guide" />
      <div ref={pivotMarkerRef} id="pivot-marker" />
    </>
  );
}
