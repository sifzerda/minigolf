// src/renderers/ObstacleRenderer.jsx

import { useRef } from "react";
import {
  RigidBody,
  BallCollider,
  CuboidCollider,
  useBeforePhysicsStep,
  useRapier,
} from "@react-three/rapier";
import { useState } from "react";
import useGameStore from "../store/useGameStore";
import { resetBall } from "../ecs/systems/ShotSystem";
import WaterSplash from "./WaterSplash";

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

function ConveyorBelt({ entity, ballRef }) {
  const { world } = useRapier();

  const size = entity.size ?? [3, 0.2, 5];
  const [x, y, z] = entity.position;

  const speed = entity.speed ?? 2;
  const acceleration = entity.acceleration ?? 8;

  const direction = entity.direction ?? [0, 0, -1];

  const length = Math.hypot(
    direction[0],
    direction[2]
  ) || 1;

  const dx = direction[0] / length;
  const dz = direction[2] / length;

  useBeforePhysicsStep(() => {
    const ball = ballRef?.current;

    if (!ball) return;

    const position = ball.translation();
    const velocity = ball.linvel();

    const withinX =
      Math.abs(position.x - x) <= size[0] / 2;

    const withinZ =
      Math.abs(position.z - z) <= size[2] / 2;

    const surfaceY = y + size[1] / 2;

    const onBelt =
      Math.abs(
        position.y - surfaceY - 0.25
      ) < 0.15;

    if (!withinX || !withinZ || !onBelt) {
      return;
    }

    const currentSpeed =
      velocity.x * dx + velocity.z * dz;

    const speedDifference =
      speed - currentSpeed;

    const correction = Math.max(
      -acceleration / 60,
      Math.min(
        acceleration / 60,
        speedDifference
      )
    );

    const mass = ball.mass();

    ball.applyImpulse(
      {
        x: dx * correction * mass,
        y: 0,
        z: dz * correction * mass,
      },
      true
    );
  });

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={entity.position}
    >
      <CuboidCollider
        args={size.map((value) => value / 2)}
        friction={1}
        restitution={0}
      />

      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={entity.color ?? "#27343a"}
          metalness={0.3}
          roughness={0.65}
        />
      </mesh>

      <mesh
        position={[0, size[1] / 2 + 0.004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry
          args={[size[0] * 0.9, size[2] * 0.9]}
        />
        <meshStandardMaterial
          color="#00e5ff"
          transparent
          opacity={0.2}
        />
      </mesh>
    </RigidBody>
  );
}


function Tunnel({ entity }) {
  const size = entity.size ?? [2, 1.5, 5];
  const [width, height, length] = size;

  const thickness = Math.min(
    entity.thickness ?? 0.15,
    width / 4,
    height / 4
  );

  const color = entity.color ?? "#586b76";

  const parts = [
    {
      position: [0, -height / 2 + thickness / 2, 0],
      size: [width, thickness, length],
    },
    {
      position: [0, height / 2 - thickness / 2, 0],
      size: [width, thickness, length],
    },
    {
      position: [-width / 2 + thickness / 2, 0, 0],
      size: [thickness, height, length],
    },
    {
      position: [width / 2 - thickness / 2, 0, 0],
      size: [thickness, height, length],
    },
  ];

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={entity.position}
      rotation={entity.rotation ?? [0, 0, 0]}
    >
      {parts.map((part, index) => (
        <group
          key={index}
          position={part.position}
        >
          <CuboidCollider
            args={part.size.map((value) => value / 2)}
            friction={0.7}
            restitution={0.1}
          />

          <mesh castShadow receiveShadow>
            <boxGeometry args={part.size} />
            <meshStandardMaterial
              color={color}
              metalness={0.2}
              roughness={0.7}
              side={2}
            />
          </mesh>
        </group>
      ))}
    </RigidBody>
  );
}


function Pipe({ entity }) {
  const radius = entity.radius ?? 0.8;
  const length = entity.length ?? 5;
  const thickness = entity.thickness ?? 0.12;
  const segments = Math.max(
    8,
    Math.floor(entity.segments ?? 16)
  );

  const color = entity.color ?? "#647d88";

  const innerRadius = radius;
  const outerRadius = radius + thickness;
  const centerRadius =
    (innerRadius + outerRadius) / 2;

  const segmentWidth =
    2 * centerRadius * Math.tan(Math.PI / segments) +
    0.01;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={entity.position}
      rotation={entity.rotation ?? [0, 0, 0]}
    >
      {Array.from({ length: segments }, (_, index) => {
        const angle =
          (index / segments) * Math.PI * 2;

        const x = Math.cos(angle) * centerRadius;
        const y = Math.sin(angle) * centerRadius;

        return (
          <group
            key={index}
            position={[x, y, 0]}
            rotation={[0, 0, angle + Math.PI / 2]}
          >
            <CuboidCollider
              args={[
                segmentWidth / 2,
                thickness / 2,
                length / 2,
              ]}
              friction={0.65}
              restitution={0.1}
            />

            <mesh castShadow receiveShadow>
              <boxGeometry
                args={[
                  segmentWidth,
                  thickness,
                  length,
                ]}
              />
              <meshStandardMaterial
                color={color}
                metalness={0.4}
                roughness={0.5}
                side={2}
              />
            </mesh>
          </group>
        );
      })}
    </RigidBody>
  );
}


function Bridge({ entity }) {
  const size = entity.size ?? [3, 0.25, 6];

  const [width, thickness, length] = size;

  const railHeight = entity.railHeight ?? 0.5;
  const railThickness = entity.railThickness ?? 0.12;

  const hasRails = entity.rails !== false;

  const color = entity.color ?? "#80664c";
  const railColor = entity.railColor ?? "#4a3829";

  const parts = [
    {
      id: "deck",
      position: [0, 0, 0],
      size: [width, thickness, length],
      color,
    },
  ];

  if (hasRails) {
    const railY =
      thickness / 2 + railHeight / 2;

    const railX =
      width / 2 - railThickness / 2;

    parts.push(
      {
        id: "left-rail",
        position: [-railX, railY, 0],
        size: [
          railThickness,
          railHeight,
          length,
        ],
        color: railColor,
      },
      {
        id: "right-rail",
        position: [railX, railY, 0],
        size: [
          railThickness,
          railHeight,
          length,
        ],
        color: railColor,
      }
    );
  }

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={entity.position}
      rotation={entity.rotation ?? [0, 0, 0]}
    >
      {parts.map((part) => (
        <group
          key={part.id}
          position={part.position}
        >
          <CuboidCollider
            args={part.size.map(
              (value) => value / 2
            )}
            friction={entity.friction ?? 0.8}
            restitution={0.1}
          />

          <mesh castShadow receiveShadow>
            <boxGeometry args={part.size} />

            <meshStandardMaterial
              color={part.color}
              roughness={0.8}
            />
          </mesh>
        </group>
      ))}
    </RigidBody>
  );
}


function ElevatedPath({ entity }) {
  const size = entity.size ?? [2, 0.2, 8];

  const [width, thickness, length] = size;

  const supportHeight = Math.max(
    0,
    entity.supportHeight ?? 1.5
  );

  const supportWidth = Math.min(
    width * 0.3,
    entity.supportWidth ?? 0.3
  );

  const hasSupports = entity.supports !== false;

  const color = entity.color ?? "#6b7c86";

  const parts = [
    {
      id: "walkway",
      position: [0, 0, 0],
      size,
    },
  ];

  if (hasSupports && supportHeight > 0) {
    const supportY =
      -thickness / 2 - supportHeight / 2;

    const supportZ =
      length / 2 - supportWidth;

    parts.push(
      {
        id: "front-support",
        position: [0, supportY, -supportZ],
        size: [
          supportWidth,
          supportHeight,
          supportWidth,
        ],
      },
      {
        id: "back-support",
        position: [0, supportY, supportZ],
        size: [
          supportWidth,
          supportHeight,
          supportWidth,
        ],
      }
    );
  }

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={entity.position}
      rotation={entity.rotation ?? [0, 0, 0]}
    >
      {parts.map((part) => (
        <group
          key={part.id}
          position={part.position}
        >
          <CuboidCollider
            args={part.size.map(
              (value) => value / 2
            )}
            friction={entity.friction ?? 0.8}
            restitution={0.1}
          />

          <mesh castShadow receiveShadow>
            <boxGeometry args={part.size} />

            <meshStandardMaterial
              color={color}
              metalness={0.15}
              roughness={0.75}
            />
          </mesh>
        </group>
      ))}
    </RigidBody>
  );
}


function WaterHazard({ entity }) {
  const [splash, setSplash] = useState(null);
  const triggeredRef = useRef(false);

  const size = entity.size ?? [3, 0.5, 3];
  const [width, depth, length] = size;

  const resetPosition =
    entity.respawnPosition ?? [0, 0.5, 0];

  function onEnter(event) {
    const ball = event.other.rigidBody;
    const ballObject = event.other.rigidBodyObject;

    const isGolfBall =
      ballObject?.userData?.isGolfBall ||
      ball?.userData?.isGolfBall;

    if (!ball || !isGolfBall) return;
    if (triggeredRef.current) return;

    const state = useGameStore.getState();

    if (state.completed || state.gameComplete) {
      return;
    }

    triggeredRef.current = true;

    const position = ball.translation();

    setSplash({
      id: Date.now(),
      position: [
        position.x - entity.position[0],
        depth / 2 + 0.02,
        position.z - entity.position[2],
      ],
    });

    // One penalty stroke.
    state.recordStroke();

    // Return the ball to the course start.
    resetBall(
      ball,
      resetPosition,
      null
    );
  }

  function onExit(event) {
    const ball = event.other.rigidBody;
    const ballObject = event.other.rigidBodyObject;

    if (
      ballObject?.userData?.isGolfBall ||
      ball?.userData?.isGolfBall
    ) {
      triggeredRef.current = false;
    }
  }

  return (
    <group position={entity.position}>
      <RigidBody
        type="fixed"
        colliders={false}
      >
        <CuboidCollider
          args={[
            width / 2,
            depth / 2,
            length / 2,
          ]}
          sensor
          onIntersectionEnter={onEnter}
          onIntersectionExit={onExit}
        />
      </RigidBody>

      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={entity.color ?? "#1479a8"}
          transparent
          opacity={0.45}
          roughness={0.15}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>

      {splash && (
        <WaterSplash
          key={splash.id}
          position={splash.position}
          onComplete={() => setSplash(null)}
        />
      )}
    </group>
  );
}


function RotatingGate({ entity }) {
  const bodyRef = useRef(null);
  const elapsedRef = useRef(0);

  const size = entity.size ?? [2, 1, 0.2];

  const speed = entity.speed ?? 1.5;
  const openAngle = entity.openAngle ?? Math.PI / 2;
  const phase = entity.phase ?? 0;

  const direction = entity.direction === -1 ? -1 : 1;

  const pivot = entity.pivot === "right" ? "right" : "left";

  const hingeX =
    pivot === "left"
      ? -size[0] / 2
      : size[0] / 2;

  useBeforePhysicsStep(() => {
    const body = bodyRef.current;
    if (!body) return;

    elapsedRef.current += 1 / 60;

    const progress =
      (Math.sin(elapsedRef.current * speed + phase) + 1) / 2;

    const angle =
      progress * openAngle * direction;

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
        args={size.map((value) => value / 2)}
        position={[-hingeX, 0, 0]}
        restitution={0.4}
        friction={0.7}
      />

      <mesh
        position={[-hingeX, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={entity.color ?? "#e0a340"}
          metalness={0.35}
          roughness={0.45}
        />
      </mesh>

      <mesh
        position={[0, 0, 0]}
        castShadow
      >
        <cylinderGeometry
          args={[0.12, 0.12, size[1] * 1.2, 16]}
        />
        <meshStandardMaterial
          color="#444444"
          metalness={0.7}
          roughness={0.3}
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
  conveyorBelt: ConveyorBelt,
  tunnel: Tunnel,
  pipe: Pipe,
  bridge: Bridge,
  elevatedPath: ElevatedPath,
  waterHazard: WaterHazard,
  rotatingGate: RotatingGate,
};

export default function ObstacleRenderer({ entity }) {
  const Component = OBSTACLE_COMPONENTS[entity.type];

  if (!Component) return null;

  return <Component entity={entity} ballRef={ballRef} />;
}
