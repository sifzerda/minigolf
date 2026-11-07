// src/renderers/CourseRenderer.jsx

import { RigidBody } from "@react-three/rapier";

export default function CourseRenderer() {
  return (
    <group>
      {/* Ground */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -0.15, 0]} receiveShadow>
          <boxGeometry args={[8, 0.3, 20]} />
          <meshStandardMaterial color="#25834a" />
        </mesh>
      </RigidBody>

      {/* Left wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-4.15, 0.3, 0]}>
          <boxGeometry args={[0.3, 0.6, 20]} />
          <meshStandardMaterial color="#795548" />
        </mesh>
      </RigidBody>

      {/* Right wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[4.15, 0.3, 0]}>
          <boxGeometry args={[0.3, 0.6, 20]} />
          <meshStandardMaterial color="#795548" />
        </mesh>
      </RigidBody>

      {/* End walls */}
      {[-10.15, 10.15].map((z) => (
        <RigidBody
          key={z}
          type="fixed"
          colliders="cuboid"
        >
          <mesh position={[0, 0.3, z]}>
            <boxGeometry args={[8.6, 0.6, 0.3]} />
            <meshStandardMaterial color="#795548" />
          </mesh>
        </RigidBody>
      ))}

      {/* Hole marker - temporary visual */}
      <mesh
        position={[0, 0.012, -8]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.35, 48]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
    </group>
  );
}
