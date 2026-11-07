// src/renderers/ObstacleRenderer.jsx

import { RigidBody, BallCollider } from "@react-three/rapier";

export default function ObstacleRenderer({ entity }) {
  if (entity.type !== "bumper") return null;

  return (
    <RigidBody
      type="fixed"
      position={entity.position}
      colliders={false}
      restitution={0.8}
    >
      <BallCollider args={[entity.radius]} />

      <mesh castShadow>
        <sphereGeometry args={[entity.radius, 24, 24]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    </RigidBody>
  );
}
