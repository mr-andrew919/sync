import { useEffect, useRef, useState } from 'react';

const MOUSE_CHANNEL = 'mouse-sync';
const MOUSE_BROADCAST_INTERVAL = 16; // ~60fps

export function useSyncedMouse() {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 }); // Normalized 0-1
  const channelRef = useRef(null);
  const lastBroadcastRef = useRef(0);
  const targetPosRef = useRef({ x: 0.5, y: 0.5 });
  const currentPosRef = useRef({ x: 0.5, y: 0.5 });
  const frameRef = useRef(null);

  useEffect(() => {
    // Initialize BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      channelRef.current = new BroadcastChannel(MOUSE_CHANNEL);

      // Listen for mouse updates from other windows
      channelRef.current.onmessage = (event) => {
        if (event.data && typeof event.data.x === 'number' && typeof event.data.y === 'number') {
          targetPosRef.current = { x: event.data.x, y: event.data.y };
        }
      };
    }

    // Handle mouse move
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      
      targetPosRef.current = { x, y };

      // Broadcast to other windows
      const now = performance.now();
      if (channelRef.current && now - lastBroadcastRef.current > MOUSE_BROADCAST_INTERVAL) {
        channelRef.current.postMessage({ x, y });
        lastBroadcastRef.current = now;
      }
    };

    // Smooth interpolation loop
    let isActive = true;
    const smoothLoop = () => {
      if (!isActive) return;

      const smoothing = 0.12; // Adjust for more/less smoothness
      currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * smoothing;
      currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * smoothing;

      setMousePos({ ...currentPosRef.current });
      frameRef.current = requestAnimationFrame(smoothLoop);
    };

    window.addEventListener('mousemove', handleMouseMove);
    frameRef.current = requestAnimationFrame(smoothLoop);

    return () => {
      isActive = false;
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  return mousePos;
}

