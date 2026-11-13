// src/renderers/GolfCupRenderer.jsx

import * as THREE from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";

// --------------------------------------------------
// Golf cup
// --------------------------------------------------

function GolfCup({ hole }) {
  const radius = hole.radius;
  const depth = hole.depth ?? 0.8;

  const [x, y, z] = hole.position;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[x, y, z]}
    >
      <mesh
        position={[0, 0.008, 0]}
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
        receiveShadow
      >
        <torusGeometry
          args={[
            radius,
            0.012,
            8,
            64,
          ]}
        />

        <meshStandardMaterial
          color="#c0c0c0"
          metalness={0.85}
          roughness={0.22}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        position={[
          0,
          -depth / 2,
          0,
        ]}
        receiveShadow
      >
        <cylinderGeometry
          args={[
            radius,
            radius,
            depth,
            48,
            1,
            true,
          ]}
        />

        <meshStandardMaterial
          color="#171717"
          side={THREE.DoubleSide}
          roughness={0.95}
        />
      </mesh>

      <CuboidCollider
        args={[
          radius * 0.7,
          0.05,
          radius * 0.7,
        ]}
        position={[
          0,
          -depth,
          0,
        ]}
        friction={0.8}
        restitution={0}
      />

      <mesh
        position={[
          0,
          -depth,
          0,
        ]}
        rotation={[
          -Math.PI / 2,
          0,
          0,
        ]}
      >
        <circleGeometry
          args={[radius, 48]}
        />

        <meshStandardMaterial
          color="#101010"
          roughness={1}
        />
      </mesh>
    </RigidBody>
  );
}


export default GolfCup;
