// src/physics/HoleSensor.jsx

import { RigidBody, CuboidCollider } from "@react-three/rapier";
import useGameStore from "../store/useGameStore";

export default function HoleSensor({ hole, ballRef }) {
  function handleIntersection({ other }) {
    if (!other.rigidBodyObject?.userData?.isGolfBall) {
      return;
    }

    const ball = ballRef.current;
    if (!ball) return;

    const position = ball.translation();
    const velocity = ball.linvel();

    const horizontalSpeed = Math.hypot(
      velocity.x,
      velocity.z
    );

    // Require the ball to be inside the cup,
    // rather than merely passing over the opening.
    if (position.y > -0.25) return;

    // Ignore balls passing through too quickly.
    if (horizontalSpeed > 3) return;

    useGameStore.getState().completeHole();
  }

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[
        hole.position[0],
        -0.52,
        hole.position[2],
      ]}
    >
      <CuboidCollider
        args={[0.2, 0.15, 0.2]}
        sensor
        onIntersectionEnter={handleIntersection}
      />
    </RigidBody>
  );
}
