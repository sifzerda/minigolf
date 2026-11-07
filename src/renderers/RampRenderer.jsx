// src/renderers/RampRenderer.jsx

import {
  RigidBody,
  CuboidCollider,
} from "@react-three/rapier";

export default function RampRenderer({ entity }) {
  const { position, size, angle, color } = entity;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={position}
      rotation={[angle, 0, 0]}
    >
      <CuboidCollider
        args={[
          size[0] / 2,
          size[1] / 2,
          size[2] / 2,
        ]}
        friction={0.85}
        restitution={0.05}
      />

      <mesh receiveShadow castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          roughness={0.95}
        />
      </mesh>
    </RigidBody>
  );
}
