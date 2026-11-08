// src/components/AdaptiveFrameRate.jsx

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

export default function AdaptiveFrameRate({
  fps = 45,
}) {
  const invalidate = useThree((state) => state.invalidate);
  const setFrameloop = useThree((state) => state.setFrameloop);

  useEffect(() => {
    const targetFPS = Math.max(15, Math.min(60, fps));

    setFrameloop("demand");

    let frameId;
    let previousTime = 0;

    const frameInterval = 1000 / targetFPS;

    function update(time) {
      if (time - previousTime >= frameInterval) {
        invalidate();
        previousTime = time;
      }

      frameId = requestAnimationFrame(update);
    }

    frameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frameId);
      setFrameloop("always");
    };
  }, [fps, invalidate, setFrameloop]);

  return null;
}
