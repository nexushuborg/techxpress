import { useState, useEffect } from 'react';
import './SeatNavigation.css';
import { useNavigate } from 'react-router-dom';

/**
 * Central Cartoon-Style Hanging Information Board
 *
 * Prominently suspended in the upper central aisle of the cartoon train,
 * featuring large readable options for ABOUT, REGISTER, and TIMELINE
 * with cartoon chains, playful cel-shaded materials, smooth bounce animation,
 * and physical 3D unfolding transitions upon option selection.
 *
 * @param {boolean} isVisible - Whether the train interior is active
 * @param {Function} onNavigate - Optional navigation callback
 */
export default function SeatNavigation({ isVisible, onNavigate }) {
  const navigate = useNavigate();

  const [hasDropped, setHasDropped] = useState(false);
  const [transitioningTo, setTransitioningTo] = useState(null);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      setHasDropped(true);
    }, 200);
    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  const handleOptionClick = (e, destination) => {
    e.preventDefault();
    if (transitioningTo) return; // Prevent duplicate triggers
    setTransitioningTo(destination);

    // Smooth, measured 3D unfolding animation sequence before route transition
    setTimeout(() => {
      if (onNavigate) {
        onNavigate(destination);
      } else {
        navigate(`/${destination}`);
      }
    }, 420);
  };

  return (
    <div className="seat-navigation-layer">
      {/* Central Cartoon Hanging Information Board - Responsive Centered Layout */}
      <div className="central-board-anchor-wrapper">
        <div
          className={`central-hanging-board-container ${hasDropped ? 'dropped' : 'stowed'} ${
            transitioningTo ? 'board-transitioning' : ''
          }`}
        >
          {/* Cartoon Suspension Chains hanging from the ceiling */}
          <div className="cartoon-suspension-system">
            <div className="chain-anchor chain-anchor-left">
              <div className="ceiling-bracket" />
              <div className="cartoon-chain">
                <div className="chain-link link-1" />
                <div className="chain-link link-2" />
                <div className="chain-link link-3" />
                <div className="chain-link link-4" />
                <div className="chain-link link-5" />
                <div className="chain-hook" />
              </div>
            </div>

            <div className="chain-anchor chain-anchor-right">
              <div className="ceiling-bracket" />
              <div className="cartoon-chain">
                <div className="chain-link link-1" />
                <div className="chain-link link-2" />
                <div className="chain-link link-3" />
                <div className="chain-link link-4" />
                <div className="chain-link link-5" />
                <div className="chain-hook" />
              </div>
            </div>
          </div>

          {/* The Cartoon Cardboard Board with subtle gentle idle sway */}
          <div className="cartoon-cardboard-board">
            {/* Top Board Mount Loops */}
            <div className="board-mount-loops">
              <span className="mount-loop loop-left" />
              <span className="mount-loop loop-right" />
            </div>

            {/* Cartoon Header Banner */}
            <div className="board-header-banner">
              <div className="banner-stitch" />
              <div className="banner-content">
                <span className="train-cartoon-icon">🚂</span>
                <span className="banner-title">TECHXPRESS INFORMATION</span>
                <span className="banner-sub">CARRIAGE № 4</span>
              </div>
            </div>

            {/* The 3 Prominent Options */}
            <div className="board-options-list">
              
              {/* Option 1: ABOUT */}
              <div
                role="button"
                tabIndex={0}
                className={`cartoon-option-card card-about ${
                  transitioningTo === 'about' ? 'selected-transition' : ''
                }`}
                onClick={(e) => handleOptionClick(e, 'about')}
              >
                <div className="option-icon-box icon-about">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div className="option-text-box">
                  <span className="option-title">ABOUT</span>
                  <span className="option-sub">EXPEDITION & VISION</span>
                </div>
                <div className="option-action-btn btn-about">
                  <span>{transitioningTo === 'about' ? 'OPENING...' : 'EXPLORE'}</span>
                  <span className="btn-arrow">➔</span>
                </div>
              </div>

              {/* Option 2: REGISTER */}
              <div
                role="button"
                tabIndex={0}
                className={`cartoon-option-card card-register ${
                  transitioningTo === 'register' ? 'selected-transition' : ''
                }`}
                onClick={(e) => handleOptionClick(e, 'register')}
              >
                <div className="option-icon-box icon-register">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M7 15h0M2 9.5h20" />
                  </svg>
                </div>
                <div className="option-text-box">
                  <span className="option-title">REGISTER</span>
                  <span className="option-sub">PASSENGER CREDENTIALS</span>
                </div>
                <div className="option-action-btn btn-register">
                  <span>{transitioningTo === 'register' ? 'OPENING...' : 'GET TICKET'}</span>
                  <span className="btn-arrow">➔</span>
                </div>
              </div>

              {/* Option 3: TIMELINE */}
              <div
                role="button"
                tabIndex={0}
                className={`cartoon-option-card card-timeline ${
                  transitioningTo === 'timeline' ? 'selected-transition' : ''
                }`}
                onClick={(e) => handleOptionClick(e, 'timeline')}
              >
                <div className="option-icon-box icon-timeline">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="option-text-box">
                  <span className="option-title">TIMELINE</span>
                  <span className="option-sub">EXPEDITION SCHEDULE</span>
                </div>
                <div className="option-action-btn btn-timeline">
                  <span>{transitioningTo === 'timeline' ? 'OPENING...' : 'VIEW'}</span>
                  <span className="btn-arrow">➔</span>
                </div>
              </div>

            </div>

            {/* Bottom Cardboard Tab / Corner Stitches */}
            <div className="board-bottom-trim">
              <span className="corner-stitch cs-left" />
              <span className="bottom-tag-text">CLICK ANY OPTION TO PROCEED</span>
              <span className="corner-stitch cs-right" />
            </div>

          </div>

        </div>
      </div>

      {/* 3. Physical 3D Cartoon Unfolding Transition Curtain */}
      {transitioningTo && (
        <div className={`cartoon-unfolding-transition-curtain curtain-${transitioningTo}`}>
          <div className="curtain-cardboard-sheet">
            <div className="curtain-header-tab">
              <span className="curtain-stitch" />
              <span className="curtain-tab-title">
                {transitioningTo === 'about' && '🚂 ABOUT TECHXPRESS'}
                {transitioningTo === 'register' && '🎫 EXPEDITION REGISTRATION'}
                {transitioningTo === 'timeline' && '🕒 EXPEDITION TIMELINE'}
              </span>
              <span className="curtain-stitch" />
            </div>
            <div className="curtain-body">
              <div className="curtain-spinner" />
              <span className="curtain-loading-text">UNFOLDING COMPARTMENT...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
