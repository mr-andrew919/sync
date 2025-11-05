import { useMemo, useState } from 'react';
import { useSyncedTimeline } from './hooks/useSyncedTimeline.js';
import { useSyncedMouse } from './hooks/useSyncedMouse.js';

function buildTransform({ phase, mouseX, mouseY }) {
  const oscillation = Math.sin(phase);
  const drift = Math.sin(phase * 0.5);
  const scale = 0.92 + 0.08 * Math.sin(phase * 1.6);
  const rotation = (phase * 180) / Math.PI;

  // Convert mouse position from 0-1 to -1 to 1 range for tilt
  const tiltX = (mouseX - 0.5) * 2;
  const tiltY = (mouseY - 0.5) * 2;
  
  // Mouse influence on movement (max 80px offset)
  const mouseOffsetX = tiltX * 80;
  const mouseOffsetY = tiltY * 80;

  return {
    ringOuter: `translate(-50%, -50%) translate3d(${mouseOffsetX * 0.3}px, ${mouseOffsetY * 0.3}px, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(4)})`,
    ringInner: `translate(-50%, -50%) translate3d(${mouseOffsetX * 0.5}px, ${mouseOffsetY * 0.5}px, 0) rotate(${(rotation * -1.2).toFixed(2)}deg) scale(${(0.75 + 0.1 * oscillation).toFixed(4)})`,
    orb: `translate(-50%, -50%) translate3d(${(oscillation * 26 + mouseOffsetX * 0.8).toFixed(2)}px, ${(drift * -18 + mouseOffsetY * 0.8).toFixed(2)}px, 0) scale(${(0.88 + 0.12 * Math.cos(phase * 1.3)).toFixed(4)})`,
    beam: `translate(-50%, -50%) translate3d(${mouseOffsetX * 0.4}px, ${mouseOffsetY * 0.4}px, 0) rotate(${(rotation * 0.8 + tiltX * 15).toFixed(2)}deg) scaleX(${(1 + 0.2 * drift).toFixed(4)})`
  };
}

export default function App() {
  const phase = useSyncedTimeline({ speed: 0.55 });
  const mousePos = useSyncedMouse();

  const transforms = useMemo(
    () => buildTransform({ phase, mouseX: mousePos.x, mouseY: mousePos.y }),
    [phase, mousePos.x, mousePos.y]
  );
  const luminosity = 0.45 + 0.35 * (Math.cos(phase * 1.8) + 1) / 2;

  const handleOpenPortal = () => {
    const newWindow = window.open(window.location.href, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      newWindow.focus();
    }
  };

  return (
    <div className="page">
      <div className="hero">
        <div className="visual" style={{ '--glow-intensity': luminosity.toFixed(4) }}>
          <div className="field" />
          <div className="beam" style={{ transform: transforms.beam }} />
          <div className="ring ring--outer" style={{ transform: transforms.ringOuter }} />
          <div className="ring ring--inner" style={{ transform: transforms.ringInner }} />
          <div className="orb" style={{ transform: transforms.orb }}>
            <div className="orb__core" />
          </div>
        </div>

        <div className="cta">
          <h1>Synced Motion Landing</h1>
          <p>
            This is a synced motion landing page.
            The orb, waves, and pulse work on the same timeline without lag.
          </p>
          <div className="cta-buttons">
            <button type="button" onClick={handleOpenPortal}>
              Open portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

