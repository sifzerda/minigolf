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

function RevolvingGate({ entity }) {
  const bodyRef = useRef(null);
  const elapsedRef = useRef(0);

  const radius = Math.max(0.3, entity.radius ?? (entity.bladeLength != null ? entity.bladeLength / 2 : 1.2));
  const bladeWidth = Math.max(0.08, entity.bladeWidth ?? 0.24);
  const bladeHeight = Math.max(0.1, entity.bladeHeight ?? 0.35);
  const bladeCount = Math.max(2, Math.min(8, Math.floor(entity.bladeCount ?? 4)));
  const speed = Math.max(0, entity.speed ?? 1.2);
  const direction = entity.direction === -1 ? -1 : 1;
  const phase = entity.phase ?? 0;
  const color = entity.color ?? "#e9edf0";

  // Kinematic motion is updated in the fixed Rapier physics step.
  // The visible blades and their colliders belong to the same rigid body.
  useBeforePhysicsStep(() => {
    const body = bodyRef.current;
    if (!body) return;

    elapsedRef.current += 1 / 60;
    const angle = phase + elapsedRef.current * speed * direction;

    body.setNextKinematicRotation({
      x: 0,
      y: Math.sin(angle / 2),
      z: 0,
      w: Math.cos(angle / 2),
    });
  });

  const blades = Array.from({ length: bladeCount }, (_, index) => {
    const angle = (index * Math.PI * 2) / bladeCount;
    return {
      angle,
      position: [
        Math.cos(angle) * radius / 2,
        0,
        Math.sin(angle) * radius / 2,
      ],
    };
  });

  return (
    <RigidBody
      ref={bodyRef}
      type="kinematicPosition"
      colliders={false}
      position={entity.position}
      rotation={[0, phase, 0]}
      canSleep={false}
    >
      {blades.map((blade, index) => (
        <group
          key={index}
          position={blade.position}
          rotation={[0, -blade.angle, 0]}
        >
          <CuboidCollider
            args={[radius / 2, bladeHeight / 2, bladeWidth / 2]}
            restitution={entity.restitution ?? 0.5}
            friction={entity.friction ?? 0.6}
          />
          <mesh castShadow receiveShadow>
            <boxGeometry args={[radius, bladeHeight, bladeWidth]} />
            <meshStandardMaterial color={color} roughness={0.55} metalness={0.15} />
          </mesh>
        </group>
      ))}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.22, bladeHeight + 0.06, 16]} />
        <meshStandardMaterial color={entity.hubColor ?? "#444b54"} metalness={0.55} roughness={0.4} />
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

function Turnstile({ entity }) {
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


function Windmill({ entity }) {
  const bladesRef = useRef(null);
  const angleRef = useRef(entity.phase ?? 0);

  const towerWidth = entity.towerWidth ?? 2.2;
  const towerHeight = entity.towerHeight ?? 4.8;
  const towerDepth = entity.towerDepth ?? 1.4;

  const openingWidth = Math.min(
    entity.openingWidth ?? 0.9,
    towerWidth - 0.2
  );

  const openingHeight = Math.min(
    entity.openingHeight ?? 0.85,
    towerHeight - 0.2
  );

  const bladeLength = entity.bladeLength ?? 2.7;
  const bladeWidth = entity.bladeWidth ?? 0.18;
  const bladeDepth = entity.bladeDepth ?? 0.12;

  const bladeCount = Math.max(
    2,
    Math.floor(entity.bladeCount ?? 4)
  );

  const speed = entity.speed ?? 1;
  const direction = entity.direction === -1 ? -1 : 1;

  const axleHeight = entity.axleHeight ?? towerHeight * 0.72;

  const towerColor = entity.towerColor ?? "#b6a18c";
  const bladeColor = entity.color ?? "#e8e1d5";
  const roofColor = entity.roofColor ?? "#704c3b";

  const sideWidth = (towerWidth - openingWidth) / 2;
  const upperHeight = towerHeight - openingHeight;

  // The arch is approximated by stepped rectangular
  // colliders, leaving a clear passage for the ball.
  const archShoulder = openingHeight * 0.7;
  const archCapHeight = openingHeight - archShoulder;
  const archCapWidth = openingWidth * 0.65;

  const towerParts = [
    {
      position: [
        -towerWidth / 2 + sideWidth / 2,
        towerHeight / 2,
        0,
      ],
      size: [sideWidth, towerHeight, towerDepth],
    },
    {
      position: [
        towerWidth / 2 - sideWidth / 2,
        towerHeight / 2,
        0,
      ],
      size: [sideWidth, towerHeight, towerDepth],
    },
    {
      position: [
        0,
        openingHeight + upperHeight / 2,
        0,
      ],
      size: [openingWidth, upperHeight, towerDepth],
    },
    {
      position: [
        -(openingWidth + archCapWidth) / 4,
        archShoulder + archCapHeight / 2,
        0,
      ],
      size: [
        (openingWidth - archCapWidth) / 2,
        archCapHeight,
        towerDepth,
      ],
    },
    {
      position: [
        (openingWidth + archCapWidth) / 4,
        archShoulder + archCapHeight / 2,
        0,
      ],
      size: [
        (openingWidth - archCapWidth) / 2,
        archCapHeight,
        towerDepth,
      ],
    },
  ];

  useBeforePhysicsStep(() => {
    const body = bladesRef.current;
    if (!body) return;

    angleRef.current +=
      (1 / 60) * speed * direction;

    const halfAngle = angleRef.current / 2;

    body.setNextKinematicRotation({
      x: 0,
      y: 0,
      z: Math.sin(halfAngle),
      w: Math.cos(halfAngle),
    });
  });

  return (
    <group position={entity.position}>
      {/* Tall rectangular tower */}
      <RigidBody type="fixed" colliders={false}>
        {towerParts.map((part, index) => (
          <group key={index} position={part.position}>
            <CuboidCollider
              args={halfSize(part.size)}
              friction={0.85}
              restitution={0.15}
            />

            <mesh castShadow receiveShadow>
              <boxGeometry args={part.size} />
              <meshStandardMaterial
                color={towerColor}
                roughness={0.9}
              />
            </mesh>
          </group>
        ))}

        {/* Four-sided pyramid roof */}
        <mesh
          position={[0, towerHeight + 0.5, 0]}
          rotation={[0, Math.PI / 4, 0]}
          castShadow
          receiveShadow
        >
          <coneGeometry
            args={[
              Math.SQRT2 *
                Math.max(towerWidth, towerDepth) *
                0.55,
              1,
              4,
            ]}
          />
          <meshStandardMaterial
            color={roofColor}
            roughness={0.8}
            flatShading
          />
        </mesh>
      </RigidBody>

      {/* Upright rotating blades */}
      <RigidBody
        ref={bladesRef}
        type="kinematicPosition"
        colliders={false}
        position={[
          0,
          axleHeight,
          -towerDepth / 2 - bladeDepth / 2 - 0.12,
        ]}
        rotation={[0, 0, entity.phase ?? Math.PI / 4]}
        canSleep={false}
      >
        {Array.from(
          { length: bladeCount },
          (_, index) => {
            const angle =
              (index / bladeCount) * Math.PI * 2;

            // Each blade extends outwards from the axle.
            const distance = bladeLength / 2;

            const position = [
              Math.sin(angle) * distance,
              Math.cos(angle) * distance,
              0,
            ];

            const rotation = [0, 0, -angle];

            return (
              <group key={index}>
                <CuboidCollider
                  position={position}
                  rotation={rotation}
                  args={[
                    bladeWidth / 2,
                    bladeLength / 2,
                    bladeDepth / 2,
                  ]}
                  friction={0.6}
                  restitution={0.5}
                />

                <mesh
                  position={position}
                  rotation={rotation}
                  castShadow
                  receiveShadow
                >
                  <boxGeometry
                    args={[
                      bladeWidth,
                      bladeLength,
                      bladeDepth,
                    ]}
                  />
                  <meshStandardMaterial
                    color={bladeColor}
                    roughness={0.65}
                    side={2}
                  />
                </mesh>
              </group>
            );
          }
        )}

        {/* Central blade hub */}
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.25, 0.25, 0.3, 20]} />
          <meshStandardMaterial
            color={entity.hubColor ?? "#555555"}
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>
      </RigidBody>
    </group>
  );
}


function Plateau({ entity }) {
  const [x, z] = entity.position ?? [0, 0];
  const radius = Math.max(0.1, entity.radius ?? 3);
  const height = Math.max(0.1, entity.height ?? 2);

  // The platform starts at ground level.
  const position = [x, height / 2, z];

  return (
    <RigidBody
      type="fixed"
      position={position}
      colliders={false}
    >
      <CuboidCollider
        args={[radius * 0.7, height / 2, radius * 0.7]}
        friction={0.9}
      />

      <mesh castShadow receiveShadow>
        <cylinderGeometry
          args={[radius, radius, height, 32]}
        />
        <meshStandardMaterial
          color={entity.color ?? "#705347"}
          roughness={0.95}
          flatShading
        />
      </mesh>
    </RigidBody>
  );
}

function Cliff({ entity }) {
  const start = entity.start ?? [0, 0];
  const end = entity.end ?? [1, 0];

  const height = Math.max(0.1, entity.height ?? 3);
  const thickness = Math.max(
    0.1,
    entity.thickness ?? 0.5
  );

  const dx = end[0] - start[0];
  const dz = end[1] - start[1];

  const length = Math.hypot(dx, dz);

  if (length < 0.001) return null;

  const centerX = (start[0] + end[0]) / 2;
  const centerZ = (start[1] + end[1]) / 2;

  const angle = -Math.atan2(dz, dx);

  const size = [length, height, thickness];

  return (
    <RigidBody
      type="fixed"
      position={[centerX, height / 2, centerZ]}
      rotation={[0, angle, 0]}
      colliders={false}
    >
      <CuboidCollider
        args={halfSize(size)}
        friction={0.85}
      />

      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={entity.color ?? "#51413b"}
          roughness={1}
          flatShading
        />
      </mesh>
    </RigidBody>
  );
}

function Ledge({ entity }) {
  const start = entity.start ?? [0, 0];
  const end = entity.end ?? [1, 0];

  const width = Math.max(0.1, entity.width ?? 2);
  const height = Math.max(0.1, entity.height ?? 2);
  const thickness = Math.max(
    0.1,
    entity.thickness ?? 0.3
  );

  const dx = end[0] - start[0];
  const dz = end[1] - start[1];

  const length = Math.hypot(dx, dz);

  if (length < 0.001) return null;

  const centerX = (start[0] + end[0]) / 2;
  const centerZ = (start[1] + end[1]) / 2;

  const angle = -Math.atan2(dz, dx);

  const size = [length, thickness, width];

  return (
    <RigidBody
      type="fixed"
      position={[centerX, height, centerZ]}
      rotation={[0, angle, 0]}
      colliders={false}
    >
      <CuboidCollider
        args={halfSize(size)}
        friction={0.9}
      />

      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={entity.color ?? "#806b56"}
          roughness={0.9}
        />
      </mesh>
    </RigidBody>
  );
}

const OBSTACLE_COMPONENTS = {
  bumper: Bumper,
  block: Block,
  movingBarrier: MovingBarrier,
  turnstile: Turnstile,
  windmill: Windmill,
  movingPlatform: MovingPlatform,
  conveyorBelt: ConveyorBelt,
  tunnel: Tunnel,
  pipe: Pipe,
  bridge: Bridge,
  elevatedPath: ElevatedPath,
  waterHazard: WaterHazard,
  plateau: Plateau,
  cliff: Cliff,
  ledge: Ledge,
};

export default function ObstacleRenderer({ entity, ballRef }) {
  const Component = OBSTACLE_COMPONENTS[entity.type];

  if (!Component) return null;

  return <Component entity={entity} ballRef={ballRef} />;
}
