// src/physics/GolfBall.jsx

import {
  RigidBody,
  BallCollider,
} from "@react-three/rapier";

import { PHYSICS } from "../ecs/constants/physics";

export default function GolfBall({ entity, ballRef }) {
  return (
    <RigidBody
      ref={ballRef}
      userData={{ isGolfBall: true }}
      position={entity.position}
      colliders={false}
      restitution={PHYSICS.restitution}
      friction={PHYSICS.surfaces.grass.friction}
      linearDamping={0.05}
      angularDamping={0.3}
      ccd
    >
      <BallCollider args={[entity.radius]} />

      <mesh castShadow>
        <sphereGeometry args={[entity.radius, 32, 32]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.28}
          metalness={0}
          clearcoat={0.25}
          clearcoatRoughness={0.2}
        />
      </mesh>
    </RigidBody>
  );
}
