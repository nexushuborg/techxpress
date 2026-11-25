import { useState, useEffect } from "react";

/**
 * StationMaster (Generic Character Guide) Component
 * 
 * @param {boolean} isVisible - Whether the guide is currently shown
 * @param {Array} dialogues - Array of { text: string, image?: string } objects
 * @param {Function} onComplete - Callback when all dialogues are finished
 * @param {Object} assets - Object containing default ttMaster and cloud image paths
 * @param {string} characterImg - Global override for character image
 * @param {string} variant - 'left' or 'right' positioning
 */
export default function StationMaster({
  isVisible,
  dialogues,
  onComplete,
  assets,
  characterImg,
  variant = 'left',
  showSkipOption = false
}) {
  const [index, setIndex] = useState(0);

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    if (index < dialogues.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    if (isVisible) setIndex(0);
  }, [isVisible]);

  if (!dialogues || dialogues.length === 0) return null;
  if (!isVisible && index === 0) return null; // Don't render until actually triggered

  const currentDialogue = dialogues[index];
  const currentText = currentDialogue.text;
  
  // Support dynamic character swapping per dialogue step
  const activeImg = currentDialogue.image || characterImg || assets.ttMaster;

  return (
    <div
      className={`guide-overlay ${isVisible ? "visible" : ""} ${!isVisible ? "exit" : ""} variant-${variant}`}
      onClick={isVisible ? handleNext : undefined}
    >
      <div className="guide-character" key={activeImg}>
        <img src={activeImg} alt="Character Guide" />
        {/* Debug: Character Origin Reference Point */}
        <div className="debug-point character-origin" />
      </div>
      <div className="guide-cloud" key={index}>
        <img src={assets.cloud} alt="Speech Bubble" />
        <div className="cloud-text">
          <p
            dangerouslySetInnerHTML={{
              __html: currentText.replace(/\n/g, "<br/>"),
            }}
          />
          <span>(Click to continue)</span>
          {showSkipOption && index === dialogues.length - 1 && (
             <label className="skip-guide-label" onClick={e => e.stopPropagation()}>
               <input type="checkbox" onChange={(e) => {
                  if (e.target.checked) {
                    window.SKIP_GUIDES = true;
                  } else {
                    window.SKIP_GUIDES = false;
                  }
               }} /> Do not show again
             </label>
          )}
        </div>
        {/* Debug: Cloud Origin Reference Point */}
        <div className="debug-point cloud-origin" />
      </div>
    </div>
  );
}
