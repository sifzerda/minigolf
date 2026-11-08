// src/renderers/GolfClub.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import useGameStore, {
  CLUB_COLORS,
} from "../store/useGameStore";

import {
  shootBall,
  getShotDirection,
} from "../ecs/systems/ShotSystem";

import { BALL_RADIUS } from "../ecs/constants/physics";
import { renderActivity } from "../utils/renderActivity";

// Animation
const BACKSWING = 0.65;
const BACKSWING_SPEED = 4;

const STRIKE_DURATION = 0.085;
const IMPACT_HOLD = 0.08;
const RETURN_DURATION = 0.16;

const REST_DISTANCE = BALL_RADIUS + 0.16;

// Club appearance
const CLUB_SCALE = 3;
const CLUB_OPACITY = 0.6;

// Club geometry
const HEAD_WIDTH = 0.64;
const HEAD_HEIGHT = 0.16;
const HEAD_DEPTH = 0.20;

// Off-centre putter head
const HEAD_OFFSET_X = 0.10;

// Local Z position at which the club face
// reaches the back of the ball.
const IMPACT_OFFSET =
  REST_DISTANCE -
  BALL_RADIUS -
  (HEAD_DEPTH * CLUB_SCALE) / 2;

// Helpers
const clamp01 = (value) =>
  Math.max(0, Math.min(1, value));

const smoothstep = (t) =>
  t * t * (3 - 2 * t);

function getBackswingOffset(power) {
  return (
    clamp01(power * BACKSWING_SPEED) *
    BACKSWING
  );
}

export default function GolfClub({
  ballRef,
  settledRef,
}) {
  const root = useRef(null);
  const motion = useRef(null);

  const phase = useRef("idle");
  const elapsed = useRef(0);
  const lastId = useRef(0);

  // Preserve the position where the shot began.
  // Otherwise the club follows the moving ball.
  const strikePosition = useRef(null);

  // Preserve the shot while its animation plays.
  const activeShot = useRef(null);

  // Preserve the club's actual position when
  // the forward strike begins.
  const strikeStartOffset = useRef(0);

  const visibleColor = useGameStore(
    (state) => state.clubColor
  );

  const color =
    CLUB_COLORS[visibleColor] ??
    CLUB_COLORS.blue;

  useFrame((_, delta) => {
    const ball = ballRef.current;
    const group = root.current;
    const club = motion.current;

    if (!ball || !group || !club) return;

    const state = useGameStore.getState();
    const request = state.shotRequest;

    // Start a new strike.
    if (
      request &&
      request.id !== lastId.current &&
      phase.current === "idle"
    ) {
      lastId.current = request.id;

      activeShot.current = { ...request };

      strikePosition.current = {
        ...ball.translation(),
      };

      // Use the actual club position to avoid
      // jumping when charging ends.
      strikeStartOffset.current =
        club.position.z;

      phase.current = "strike";
      elapsed.current = 0;
    }

    const active = phase.current !== "idle";

    group.visible =
      (
        settledRef.current &&
        !state.completed &&
        !state.gameComplete
      ) ||
      active;

    if (!group.visible) return;

    const shot = activeShot.current;

    const angle =
      active && shot
        ? shot.angle
        : state.aimAngle;

    const direction = getShotDirection(angle);

    // Keep the club at its original shot position
    // during impact and retraction.
    const position =
      active && strikePosition.current
        ? strikePosition.current
        : ball.translation();

    group.position.set(
      position.x -
        direction.x * REST_DISTANCE,
      position.y -
        BALL_RADIUS + 0.12,
      position.z -
        direction.z * REST_DISTANCE
    );

    group.rotation.y = angle;

    let offset = 0;

    // -----------------------------------------
    // IDLE / BACKSWING
    // -----------------------------------------

    if (phase.current === "idle") {
      offset = state.charging
        ? getBackswingOffset(state.power)
        : 0;
    }

    // -----------------------------------------
    // STRIKE
    // -----------------------------------------

    else if (phase.current === "strike") {
      elapsed.current += Math.min(delta, 0.05);

      const t = clamp01(
        elapsed.current / STRIKE_DURATION
      );

      // Accelerating movement towards the ball.
      const progress = t * t;

      offset =
        strikeStartOffset.current +
        (
          IMPACT_OFFSET -
          strikeStartOffset.current
        ) * progress;

      if (t >= 1) {
        // Stop exactly at impact.
        offset = IMPACT_OFFSET;

        if (shot) {
          shootBall(
            ball,
            shot.power,
            shot.angle,
            settledRef,
            shot.jump
          );

          state.clearShotRequest(shot.id);
        }

        phase.current = "impact";
        elapsed.current = 0;
      }
    }

    // -----------------------------------------
    // IMPACT HOLD
    // -----------------------------------------

    else if (phase.current === "impact") {
      // No forward follow-through.
      // Club remains at the impact point.
      offset = IMPACT_OFFSET;

      elapsed.current += Math.min(delta, 0.05);

      if (elapsed.current >= IMPACT_HOLD) {
        phase.current = "return";
        elapsed.current = 0;
      }
    }

    // -----------------------------------------
    // RETURN
    // -----------------------------------------

    else if (phase.current === "return") {
      elapsed.current += Math.min(delta, 0.05);

      const t = clamp01(
        elapsed.current / RETURN_DURATION
      );

      const progress = smoothstep(t);

      // Retract to resting position without
      // pushing through the ball.
      offset =
        IMPACT_OFFSET * (1 - progress);

      if (t >= 1) {
        offset = 0;

        phase.current = "idle";
        elapsed.current = 0;

        strikePosition.current = null;
        activeShot.current = null;
      }
    }

    club.position.z = offset;

    // Keep animation frames rendering.
    if (active || state.charging) {
      renderActivity.wake(200);
    }
  });

  return (
    <group ref={root} visible={false}>
      <group ref={motion}>
        <group scale={CLUB_SCALE}>
          {/* Putter head */}
          <mesh
            castShadow
            receiveShadow
            position={[HEAD_OFFSET_X, 0, 0]}
          >
            <boxGeometry
              args={[
                HEAD_WIDTH,
                HEAD_HEIGHT,
                HEAD_DEPTH,
              ]}
            />

            <meshStandardMaterial
              color={color}
              roughness={0.55}
              transparent
              opacity={CLUB_OPACITY}
              depthWrite={false}
            />
          </mesh>

          {/* Club neck */}
          <mesh
            castShadow
            position={[0, 0.08, 0.07]}
          >
            <boxGeometry
              args={[0.15, 0.14, 0.22]}
            />

            <meshStandardMaterial
              color={color}
              roughness={0.55}
              transparent
              opacity={CLUB_OPACITY}
              depthWrite={false}
            />
          </mesh>

          {/* Shaft and grip */}
          <group
            position={[0, 0.17, 0.13]}
            rotation={[0.13, 0, 0]}
          >
            {/* Metallic shaft */}
            <mesh
              castShadow
              position={[0, 0.68, 0]}
            >
              <cylinderGeometry
                args={[
                  0.022,
                  0.022,
                  1.36,
                  10,
                ]}
              />

              <meshStandardMaterial
                color="#aab4bc"
                metalness={0.85}
                roughness={0.25}
                transparent
                opacity={CLUB_OPACITY}
                depthWrite={false}
              />
            </mesh>

            {/* Rubber grip */}
            <mesh
              castShadow
              position={[0, 1.22, 0]}
            >
              <cylinderGeometry
                args={[
                  0.057,
                  0.048,
                  0.48,
                  12,
                ]}
              />

              <meshStandardMaterial
                color={color}
                roughness={0.8}
                transparent
                opacity={CLUB_OPACITY}
                depthWrite={false}
              />
            </mesh>

            {/* Grip end cap */}
            <mesh position={[0, 1.45, 0]}>
              <cylinderGeometry
                args={[
                  0.058,
                  0.058,
                  0.025,
                  12,
                ]}
              />

              <meshStandardMaterial
                color="#e6e6e6"
                transparent
                opacity={CLUB_OPACITY}
                depthWrite={false}
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
