// src/renderers/CourseGeometryRenderer.jsx

import { useMemo } from "react";
import {
  RigidBody,
  CuboidCollider,
  TrimeshCollider,
  CylinderCollider,
} from "@react-three/rapier";

import {
  Shape,
  Path,
  ShapeGeometry,
  DoubleSide,
} from "three";

function createPolygonGeometry(section, hole) {
  const shape = new Shape();

  section.points.forEach(([x, z], index) => {
    if (index === 0) {
      shape.moveTo(x, -z);
    } else {
      shape.lineTo(x, -z);
    }
  });

  shape.closePath();

  if (hole) {
    const [hx, , hz] = hole.position;

    const opening = new Path();

    opening.absarc(
      hx,
      -hz,
      hole.radius,
      0,
      Math.PI * 2,
      true
    );

    shape.holes.push(opening);
  }

  const geometry = new ShapeGeometry(shape, 64);
  geometry.rotateX(-Math.PI / 2);

  return geometry;
}

function createColliderData(geometry) {
  const source = geometry.index
    ? geometry.toNonIndexed()
    : geometry;

  const attribute = source.getAttribute("position");

  const vertices = new Float32Array(attribute.array);

  const indices = new Uint32Array(
    Array.from(
      { length: attribute.count },
      (_, index) => index
    )
  );

  if (source !== geometry) {
    source.dispose();
  }

  return [vertices, indices];
}

export function CourseSection({ section, hole }) {
  const isFloor = section.type === "floor";

  const geometry = useMemo(() => {
    if (!isFloor) return null;

    return createPolygonGeometry(section, hole);
  }, [section, hole, isFloor]);

  const colliderData = useMemo(() => {
    if (!geometry) return null;

    return createColliderData(geometry);
  }, [geometry]);

  if (!isFloor) {
    return (
      <RigidBody
        type="fixed"
        colliders={false}
        position={section.position}
        rotation={section.rotation ?? [0, 0, 0]}
      >
        <CuboidCollider
          args={section.size.map((v) => v / 2)}
          friction={section.friction ?? 0.85}
        />

        <mesh castShadow receiveShadow>
          <boxGeometry args={section.size} />

          <meshStandardMaterial
            color={section.color ?? "#25834a"}
            roughness={0.9}
          />
        </mesh>
      </RigidBody>
    );
  }

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={[0, section.y ?? 0, 0]}
    >
      <TrimeshCollider
        args={colliderData}
        friction={section.friction ?? 0.85}
      />

      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color={section.color ?? "#25834a"}
          roughness={0.95}
          side={DoubleSide}
        />
      </mesh>
    </RigidBody>
  );
}

export function CourseWall({ wall }) {
  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={wall.position}
      rotation={wall.rotation ?? [0, 0, 0]}
    >
      <CuboidCollider
        args={wall.size.map((v) => v / 2)}
        friction={0.7}
        restitution={0.35}
      />

      <mesh castShadow receiveShadow>
        <boxGeometry args={wall.size} />

        <meshStandardMaterial
          color={wall.color ?? "#795548"}
        />
      </mesh>
    </RigidBody>
  );
}

function GolfCup({ hole }) {
  const radius = hole.radius;
  const depth = 0.8;

  const wallCollider = useMemo(() => {
    const vertices = [];
    const indices = [];
    const segments = 48;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;

      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      vertices.push(x, 0, z);
      vertices.push(x, -depth, z);
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;

      indices.push(a, a + 1, a + 2);
      indices.push(a + 1, a + 3, a + 2);
    }

    return [
      new Float32Array(vertices),
      new Uint32Array(indices),
    ];
  }, [radius]);

  return (
    <group position={hole.position}>
      <RigidBody type="fixed" colliders={false}>
        <TrimeshCollider
          args={wallCollider}
          friction={0.65}
        />

        <CylinderCollider
          args={[0.05, radius]}
          position={[0, -depth - 0.05, 0]}
        />
      </RigidBody>

      <mesh position={[0, -depth / 2, 0]}>
        <cylinderGeometry
          args={[radius, radius, depth, 48, 1, true]}
        />

        <meshStandardMaterial
          color="#d9d9d9"
          side={DoubleSide}
        />
      </mesh>

      <mesh position={[0, -depth - 0.05, 0]}>
        <cylinderGeometry
          args={[radius, radius, 0.1, 48]}
        />

        <meshStandardMaterial color="#333333" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry
          args={[radius, 0.018, 8, 48]}
        />

        <meshStandardMaterial color="#eeeeee" />
      </mesh>
    </group>
  );
}

export default function CourseGeometryRenderer({ course }) {
  return (
    <group>
      {course.sections.map((section) => (
        <CourseSection
          key={section.id}
          section={section}
          hole={
            section.type === "floor" && section.id === "main-floor"
              ? course.hole
              : null
          }
        />
      ))}

      {course.walls.map((wall) => (
        <CourseWall
          key={wall.id}
          wall={wall}
        />
      ))}

      <GolfCup hole={course.hole} />
    </group>
  );
}
