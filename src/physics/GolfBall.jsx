// src/physics/GolfBall.jsx

import { memo } from "react";
import * as THREE from "three";

import {
  RigidBody,
  BallCollider,
} from "@react-three/rapier";

import {
  PHYSICS,
} from "../ecs/constants/physics";

const BALL_GEOMETRY = new THREE.SphereGeometry(1, 24, 16);

const BALL_MATERIAL = new THREE.MeshPhysicalMaterial({
  color: "#ffffff",
  roughness: 0.28,
  metalness: 0,
  clearcoat: 0.25,
  clearcoatRoughness: 0.2,
});

function GolfBall({ entity, ballRef }) {
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

      <mesh
        geometry={BALL_GEOMETRY}
        material={BALL_MATERIAL}
        scale={entity.radius}
        castShadow
      />
    </RigidBody>
  );
}

export default memo(GolfBall);
