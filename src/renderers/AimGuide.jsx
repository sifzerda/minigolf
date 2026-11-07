// src/renderers/AimGuide.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import useGameStore from "../store/useGameStore";
import { isBallStopped } from "../ecs/systems/ShotSystem";

export default function AimGuide({ ballRef }) {
  const guideRef = useRef(null);

  useFrame(() => {
    const guide = guideRef.current;
    const ball = ballRef.current;

    if (!guide || !ball) return;

    const state = useGameStore.getState();

    guide.visible =
      !state.completed && isBallStopped(ball);

    if (!guide.visible) return;

    const position = ball.translation();

    guide.position.set(
      position.x,
      position.y,
      position.z
    );

    guide.rotation.y = state.aimAngle;
    guide.scale.z = 0.5 + state.power * 1.5;
  });

  return (
    <group ref={guideRef}>
      <mesh position={[0, 0, -1]}>
        <boxGeometry args={[0.045, 0.045, 2]} />
        <meshBasicMaterial
          color="#a3ff12"
          transparent
          opacity={0.8}
          depthWrite={false}
        />
      </mesh>

      <mesh
        position={[0, 0, -2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <coneGeometry args={[0.16, 0.4, 3]} />
        <meshBasicMaterial color="#a3ff12" />
      </mesh>
    </group>
  );
}
