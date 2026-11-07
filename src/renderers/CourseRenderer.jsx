// src/renderers/CourseRenderer.jsx

import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { Shape } from "three";

const COURSE_WIDTH = 8;
const COURSE_LENGTH = 20;

const HOLE_X = 0;
const HOLE_Z = -8;
const HOLE_RADIUS = 0.43;
const CUP_DEPTH = 0.8;

function CourseFloor() {
  const geometry = useMemo(() => {
    const shape = new Shape();

    shape.moveTo(-COURSE_WIDTH / 2, -COURSE_LENGTH / 2);
    shape.lineTo(COURSE_WIDTH / 2, -COURSE_LENGTH / 2);
    shape.lineTo(COURSE_WIDTH / 2, COURSE_LENGTH / 2);
    shape.lineTo(-COURSE_WIDTH / 2, COURSE_LENGTH / 2);
    shape.closePath();

    // Shape coordinates are rotated into the XZ plane.
    // Local Y = -world Z.
    const hole = new Shape();

    hole.absarc(
      HOLE_X,
      -HOLE_Z,
      HOLE_RADIUS,
      0,
      Math.PI * 2,
      true
    );

    shape.holes.push(hole);

    return shape;
  }, []);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <shapeGeometry args={[geometry, 64]} />
        <meshStandardMaterial
          color="#25834a"
          roughness={0.95}
          side={2}
        />
      </mesh>
    </RigidBody>
  );
}

function CourseWall({ position, size }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#795548" />
      </mesh>
    </RigidBody>
  );
}

function GolfCup() {
  return (
    <group position={[HOLE_X, 0, HOLE_Z]}>
      {/* Physical cylindrical cup wall */}
      <RigidBody type="fixed" colliders="trimesh">
        <mesh position={[0, -CUP_DEPTH / 2, 0]}>
          <cylinderGeometry
            args={[
              HOLE_RADIUS,
              HOLE_RADIUS,
              CUP_DEPTH,
              48,
              1,
              true
            ]}
          />
          <meshStandardMaterial
            color="#d9d9d9"
            metalness={0.35}
            roughness={0.5}
            side={2}
          />
        </mesh>
      </RigidBody>

      {/* Physical bottom of the cup */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -CUP_DEPTH - 0.05, 0]}>
          <cylinderGeometry args={[HOLE_RADIUS, HOLE_RADIUS, 0.1, 48]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </RigidBody>

      {/* Decorative rim - no collider */}
      <mesh
        position={[0, 0.008, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[HOLE_RADIUS, 0.025, 8, 48]} />
        <meshStandardMaterial
          color="#eeeeee"
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>
    </group>
  );
}

export default function CourseRenderer() {
  return (
    <group>
      <CourseFloor />

      <CourseWall
        position={[-4.15, 0.3, 0]}
        size={[0.3, 0.6, 20]}
      />

      <CourseWall
        position={[4.15, 0.3, 0]}
        size={[0.3, 0.6, 20]}
      />

      <CourseWall
        position={[0, 0.3, -10.15]}
        size={[8.6, 0.6, 0.3]}
      />

      <CourseWall
        position={[0, 0.3, 10.15]}
        size={[8.6, 0.6, 0.3]}
      />

      <GolfCup />
    </group>
  );
}
