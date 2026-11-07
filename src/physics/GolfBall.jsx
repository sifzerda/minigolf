// src/physics/GolfBall.jsx

import {
  RigidBody,
  BallCollider,
} from "@react-three/rapier";

export default function GolfBall({ entity, ballRef }) {
  return (
    <RigidBody
      ref={ballRef}
      position={entity.position}
      colliders={false}
      restitution={0.25}
      friction={0.8}
      linearDamping={0.65}
      angularDamping={1.2}
      ccd
    >
      <BallCollider args={[entity.radius]} />

      <mesh castShadow>
        <sphereGeometry args={[entity.radius, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.35}
        />
      </mesh>
    </RigidBody>
  );
}
