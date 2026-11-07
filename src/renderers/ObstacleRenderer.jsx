// src/renderers/ObstacleRenderer.jsx

import { useRef } from "react";
import {
  RigidBody,
  BallCollider,
  CuboidCollider,
  useBeforePhysicsStep,
} from "@react-three/rapier";

const halfSize = (size) =>
  size.map((value) => value / 2);

function Bumper({ entity }) {
  const radius = entity.radius ?? 0.5;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={entity.position}
      restitution={0.9}
      friction={0.4}
    >
      <BallCollider args={[radius]} />

      <mesh castShadow receiveShadow>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={entity.color ?? "#ff5555"}
          metalness={0.2}
          roughness={0.4}
        />
      </mesh>
    </RigidBody>
  );
}

function Block({ entity }) {
  const size = entity.size ?? [1, 0.8, 1];

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={entity.position}
      rotation={entity.rotation ?? [0, 0, 0]}
    >
      <CuboidCollider
        args={halfSize(size)}
        restitution={0.45}
      />

      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={entity.color ?? "#777777"}
        />
      </mesh>
    </RigidBody>
  );
}

function MovingBarrier({ entity }) {
  const bodyRef = useRef(null);
  const elapsedRef = useRef(0);

  const size = entity.size ?? [2, 0.6, 0.3];
  const distance = entity.distance ?? 2;
  const speed = entity.speed ?? 1;

  useBeforePhysicsStep(() => {
    const body = bodyRef.current;
    if (!body) return;

    elapsedRef.current += 1 / 60;

    const offset =
      Math.sin(elapsedRef.current * speed) *
      distance;

    const [x, y, z] = entity.position;

    body.setNextKinematicTranslation({
      x: x + offset,
      y,
      z,
    });
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={entity.position}
    >
      <CuboidCollider
        args={halfSize(size)}
        restitution={0.6}
      />

      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={entity.color ?? "#ffcc33"}
        />
      </mesh>
    </RigidBody>
  );
}

function Windmill({ entity }) {
  const bodyRef = useRef(null);
  const elapsedRef = useRef(0);

  const speed = entity.speed ?? 1.5;
  const bladeLength = entity.bladeLength ?? 3;
  const bladeWidth = entity.bladeWidth ?? 0.3;

  useBeforePhysicsStep(() => {
    const body = bodyRef.current;
    if (!body) return;

    elapsedRef.current += 1 / 60;

    const angle = elapsedRef.current * speed;

    body.setNextKinematicRotation({
      x: 0,
      y: Math.sin(angle / 2),
      z: 0,
      w: Math.cos(angle / 2),
    });
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={entity.position}
    >
      <CuboidCollider
        args={[
          bladeLength / 2,
          0.2,
          bladeWidth / 2,
        ]}
        restitution={0.7}
      />

      <CuboidCollider
        args={[
          bladeWidth / 2,
          0.2,
          bladeLength / 2,
        ]}
        restitution={0.7}
      />

      <mesh castShadow receiveShadow>
        <boxGeometry
          args={[bladeLength, 0.4, bladeWidth]}
        />
        <meshStandardMaterial
          color={entity.color ?? "#eeeeee"}
        />
      </mesh>

      <mesh castShadow receiveShadow>
        <boxGeometry
          args={[bladeWidth, 0.4, bladeLength]}
        />
        <meshStandardMaterial
          color={entity.color ?? "#eeeeee"}
        />
      </mesh>
    </RigidBody>
  );
}

function MovingPlatform({ entity }) {
  const bodyRef = useRef(null);
  const elapsedRef = useRef(0);

  const size = entity.size ?? [3, 0.3, 3];

  const axis = ["x", "y", "z"].includes(entity.axis)
    ? entity.axis
    : "x";

  const distance = Math.max(
    0,
    entity.distance ?? 3
  );

  const speed = Math.max(
    0,
    entity.speed ?? 1
  );

  const [x, y, z] = entity.position;

  useBeforePhysicsStep(() => {
    const body = bodyRef.current;
    if (!body) return;

    elapsedRef.current += 1 / 60;

    const offset =
      Math.sin(elapsedRef.current * speed) *
      distance;

    body.setNextKinematicTranslation({
      x: x + (axis === "x" ? offset : 0),
      y: y + (axis === "y" ? offset : 0),
      z: z + (axis === "z" ? offset : 0),
    });
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={entity.position}
      canSleep={false}
    >
      <CuboidCollider
        args={halfSize(size)}
        friction={entity.friction ?? 1.5}
        restitution={0}
      />

      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={entity.color ?? "#ffcc33"}
          metalness={0.15}
          roughness={0.7}
        />
      </mesh>

      <mesh
        position={[0, size[1] / 2 + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry
          args={[size[0] * 0.85, size[2] * 0.85]}
        />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </RigidBody>
  );
}

const OBSTACLE_COMPONENTS = {
  bumper: Bumper,
  block: Block,
  movingBarrier: MovingBarrier,
  windmill: Windmill,
  movingPlatform: MovingPlatform,
};

export default function ObstacleRenderer({ entity }) {
  const Component = OBSTACLE_COMPONENTS[entity.type];

  if (!Component) return null;

  return <Component entity={entity} />;
}
