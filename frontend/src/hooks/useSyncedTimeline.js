import { useEffect, useRef, useState } from 'react';

// Global shared state for cross-window sync
const SYNC_CHANNEL = 'timeline-sync';
const SYNC_INTERVAL = 100; // Broadcast every 100ms

export function useSyncedTimeline({ speed = 0.75, autoStart = true } = {}) {
  const [phase, setPhase] = useState(0);
  const frameRef = useRef(null);
  const lastTimeRef = useRef(null);
  const phaseRef = useRef(0);
  const channelRef = useRef(null);
  const lastBroadcastRef = useRef(0);
  const isMasterRef = useRef(false);

  useEffect(() => {
    if (!autoStart) {
      return undefined;
    }

    let isActive = true;

    // Initialize BroadcastChannel for cross-window sync
    if (typeof BroadcastChannel !== 'undefined') {
      channelRef.current = new BroadcastChannel(SYNC_CHANNEL);
      
      // Listen for phase updates from other windows
      channelRef.current.onmessage = (event) => {
        if (event.data && typeof event.data.phase === 'number') {
          phaseRef.current = event.data.phase;
          setPhase(event.data.phase);
          lastTimeRef.current = performance.now();
          isMasterRef.current = false; // Another window is broadcasting, we follow
        }
      };

      // Initially assume this window is master (first opened)
      isMasterRef.current = true;
    }

    const loop = (time) => {
      if (!isActive) {
        return;
      }

      if (lastTimeRef.current !== null) {
        const deltaSeconds = (time - lastTimeRef.current) / 1000;
        phaseRef.current += deltaSeconds * speed * Math.PI * 2;
        setPhase(phaseRef.current);

        // Broadcast phase to other windows if we're master and enough time passed
        if (
          channelRef.current &&
          isMasterRef.current &&
          time - lastBroadcastRef.current > SYNC_INTERVAL
        ) {
          channelRef.current.postMessage({ phase: phaseRef.current });
          lastBroadcastRef.current = time;
        }
      }

      lastTimeRef.current = time;
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);

    return () => {
      isActive = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (channelRef.current) {
        channelRef.current.close();
      }
      frameRef.current = null;
      lastTimeRef.current = null;
      channelRef.current = null;
    };
  }, [speed, autoStart]);

  return phase;
}

