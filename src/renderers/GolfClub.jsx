// src/renderers/GolfClub.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import useGameStore, { CLUB_COLORS } from "../store/useGameStore";
import { shootBall, getShotDirection } from "../ecs/systems/ShotSystem";
import { BALL_RADIUS } from "../ecs/constants/physics";
import { renderActivity } from "../utils/renderActivity";

const BACKSWING = 0.85;
const STRIKE_DURATION = 0.22;
const FOLLOW_DURATION = 0.20;
const REST_DISTANCE = BALL_RADIUS + 0.16;

export default function GolfClub({ ballRef, settledRef }) {
  const root = useRef(null);
  const motion = useRef(null);
  const phase = useRef("idle");
  const elapsed = useRef(0);
  const lastId = useRef(0);
  const visibleColor = useGameStore((s) => s.clubColor);
  const color = CLUB_COLORS[visibleColor] ?? CLUB_COLORS.blue;

  useFrame((_, delta) => {
    const ball = ballRef.current;
    const group = root.current;
    const head = motion.current;
    if (!ball || !group || !head) return;
    const state = useGameStore.getState();
    const request = state.shotRequest;
    if (request && request.id !== lastId.current && phase.current === "idle") {
      lastId.current = request.id;
      phase.current = "strike";
      elapsed.current = 0;
    }
    const active = phase.current !== "idle";
    group.visible = (settledRef.current && !state.completed && !state.gameComplete) || active;
    if (!group.visible) return;
    renderActivity.wake(200);
    const pos = ball.translation();
    const angle = active && request ? request.angle : state.aimAngle;
    const direction = getShotDirection(angle);
    group.position.set(pos.x - direction.x * REST_DISTANCE, pos.y - BALL_RADIUS + 0.12,
      pos.z - direction.z * REST_DISTANCE);
    // Local +Z points away from the shot; local -Z points toward the ball.
    group.rotation.y = angle;
    let offset = 0;
    if (phase.current === "idle") {
      offset = state.charging ? state.power * BACKSWING : 0;
    } else {
      elapsed.current += Math.min(delta, 0.05);
      if (phase.current === "strike") {
        const t = Math.min(1, elapsed.current / STRIKE_DURATION);
        // Start from the charged backswing, end just beyond the ball.
        offset = request.power * BACKSWING * (1 - t * t) - 0.20 * t * t;
        if (t >= 1) {
          // The only place where the actual Rapier impulse is applied.
          shootBall(ballRef.current, request.power, request.angle, settledRef, request.jump);
          state.clearShotRequest(request.id);
          phase.current = "follow";
          elapsed.current = 0;
        }
      } else {
        const t = Math.min(1, elapsed.current / FOLLOW_DURATION);
        offset = -0.20 * (1 - t);
        if (t >= 1) phase.current = "idle";
      }
    }
    head.position.z = offset;
  });

  return (
    <group ref={root} visible={false}>
      <group ref={motion}>
        {/* T-shaped mini-golf putter head; long axis is local X. */}
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.64, 0.16, 0.20]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
        <mesh castShadow position={[0, 0.08, 0.07]}>
          <boxGeometry args={[0.15, 0.14, 0.22]} />
          <meshStandardMaterial color={color} roughness={0.55} />
        </mesh>
        {/* Slight shaft lean toward the golfer. */}
        <group position={[0, 0.17, 0.13]} rotation={[0.13, 0, 0]}>
          <mesh castShadow position={[0, 0.68, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 1.36, 10]} />
            <meshStandardMaterial color="#aab4bc" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh castShadow position={[0, 1.22, 0]}>
            <cylinderGeometry args={[0.057, 0.048, 0.48, 12]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, 1.45, 0]}>
            <cylinderGeometry args={[0.058, 0.058, 0.025, 12]} />
            <meshStandardMaterial color="#e6e6e6" />
          </mesh>
        </group>
      </group>
    </group>
  );
}
