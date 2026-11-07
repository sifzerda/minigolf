// src/renderers/AimGuide.jsx

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Vector3,
} from "three";

import useGameStore from "../store/useGameStore";
import { BALL_RADIUS, PHYSICS } from "../ecs/constants/physics";
import { resolveSurface } from "../ecs/systems/SurfaceSystem";
import {
  getShotDirection,
  getShotImpulse,
} from "../ecs/systems/ShotSystem";

const MAX_POINTS = 240;
const MAX_BOUNCES = 2;

const STEP = 0.12;
const EPSILON = 0.015;
const MIN_DISTANCE = 0.02;

// Calibration factor for approximate shot distance.
const DISTANCE_MULTIPLIER = 6;

const BOUNCE_RETENTION = 0.6;
const SPIN_CURVE = 0.012;
const TOPSPIN_FACTOR = 0.3;

const UP = { x: 0, y: 0, z: 0, w: 1 };

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

function makeGeometry() {
  const geometry = new BufferGeometry();

  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(
      new Float32Array(MAX_POINTS * 3),
      3
    )
  );

  geometry.setDrawRange(0, 0);

  return geometry;
}

function getResistance(surface) {
  return (
    PHYSICS.surfaces[surface]?.resistance ??
    PHYSICS.surfaces.grass.resistance
  );
}

function estimateDistance(power, topSpin, surface) {
  const impulse = getShotImpulse(power);

  const resistance = getResistance(surface);

  const surfaceFactor = clamp(
    PHYSICS.surfaces.grass.resistance /
      Math.max(0.05, resistance),
    0.3,
    2.5
  );

  const spinFactor = clamp(
    1 + topSpin * TOPSPIN_FACTOR,
    0.5,
    1.5
  );

  return (
    impulse *
    DISTANCE_MULTIPLIER *
    surfaceFactor *
    spinFactor
  );
}

function getHitNormal(hit) {
  const normal = hit.normal1 ?? hit.normal;

  if (!normal) return null;

  const result = new Vector3(
    normal.x,
    0,
    normal.z
  );

  if (result.lengthSq() < 0.0001) {
    return null;
  }

  return result.normalize();
}

function reflect(direction, normal) {
  return direction
    .clone()
    .addScaledVector(
      normal,
      -2 * direction.dot(normal)
    )
    .normalize();
}

export default function AimGuide({
  ballRef,
  settledRef,
}) {
  const { world, rapier } = useRapier();

  const guideRef = useRef(null);

  const geometry = useMemo(
    () => makeGeometry(),
    []
  );

  const sphere = useMemo(
    () => new rapier.Ball(BALL_RADIUS),
    [rapier]
  );

  const points = useRef([]);

  const lastInput = useRef(null);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame(() => {
    const guide = guideRef.current;
    const ball = ballRef.current;

    if (!guide || !ball || !world) return;

    const state = useGameStore.getState();

    const visible =
      !state.completed &&
      !state.gameComplete &&
      Boolean(settledRef.current);

    guide.visible = visible;

    if (!visible) {
      lastInput.current = null;
      return;
    }

    const position = ball.translation();

    const power = state.power;
    const angle = state.aimAngle;
    const topSpin = state.topSpin ?? 0;
    const sideSpin = state.sideSpin ?? 0;

    // Recalculate only when relevant inputs change.
    // Periodic refresh also accounts for moving obstacles.
    const now = performance.now();

    const previous = lastInput.current;

    if (
      previous &&
      previous.power === power &&
      previous.angle === angle &&
      previous.topSpin === topSpin &&
      previous.sideSpin === sideSpin &&
      Math.abs(previous.x - position.x) < 0.001 &&
      Math.abs(previous.y - position.y) < 0.001 &&
      Math.abs(previous.z - position.z) < 0.001 &&
      now - previous.time < 150
    ) {
      return;
    }

    lastInput.current = {
      power,
      angle,
      topSpin,
      sideSpin,
      x: position.x,
      y: position.y,
      z: position.z,
      time: now,
    };

    const initial = getShotDirection(angle);

    let direction = new Vector3(
      initial.x,
      0,
      initial.z
    ).normalize();

    let origin = new Vector3(
      position.x,
      position.y,
      position.z
    );

    const initialSurface = resolveSurface(
      position,
      { grounded: true }
    );

    let remainingDistance = estimateDistance(
      power,
      topSpin,
      initialSurface
    );

    let bounces = 0;
    let traveled = 0;

    const output = points.current;
    output.length = 0;

    while (
      remainingDistance > MIN_DISTANCE &&
      output.length < MAX_POINTS
    ) {
      const stepDistance = Math.min(
        STEP,
        remainingDistance
      );

      const shapeHit = world.castShape(
        {
          x: origin.x,
          y: origin.y,
          z: origin.z,
        },
        UP,
        {
          x: direction.x,
          y: 0,
          z: direction.z,
        },
        sphere,
        stepDistance,
        true,
        undefined,
        undefined,
        undefined,
        ball
      );

      const hitDistance = shapeHit
        ? clamp(
            shapeHit.timeOfImpact,
            0,
            stepDistance
          )
        : stepDistance;

      const next = origin
        .clone()
        .addScaledVector(
          direction,
          hitDistance
        );

      if (hitDistance > 0.001) {
        output.push(next.clone());

        traveled += hitDistance;
        remainingDistance -= hitDistance;
      }

      if (shapeHit) {
        const normal = getHitNormal(shapeHit);

        if (
          !normal ||
          bounces >= MAX_BOUNCES ||
          direction.dot(normal) >= -0.001
        ) {
          break;
        }

        direction = reflect(
          direction,
          normal
        );

        remainingDistance *= BOUNCE_RETENTION;

        // Separate the next cast from the wall.
        origin = next.addScaledVector(
          normal,
          EPSILON
        );

        bounces++;
        continue;
      }

      origin = next;

      // Approximate curve from sidespin.
      // Direction rotates gradually along the path.
      const curve =
        sideSpin *
        SPIN_CURVE *
        stepDistance;

      direction.applyAxisAngle(
        new Vector3(0, 1, 0),
        curve
      );

      // Apply additional distance loss for surfaces
      // encountered along the predicted route.
      const surface = resolveSurface(
        origin,
        { grounded: true }
      );

      const resistance = getResistance(surface);

      const grassResistance =
        PHYSICS.surfaces.grass.resistance;

      const extraResistance = Math.max(
        0,
        resistance - grassResistance
      );

      remainingDistance = Math.max(
        0,
        remainingDistance -
          extraResistance * stepDistance * 0.12
      );
    }

    const attribute = geometry.getAttribute(
      "position"
    );

    const count = Math.min(
      output.length,
      MAX_POINTS
    );

    for (let i = 0; i < count; i++) {
      const point = output[i];

      attribute.setXYZ(
        i,
        point.x,
        point.y + 0.04,
        point.z
      );
    }

    attribute.needsUpdate = true;

    geometry.setDrawRange(0, count);
    geometry.computeBoundingSphere();
  });

  return (
    <points
      ref={guideRef}
      geometry={geometry}
      frustumCulled={false}
    >
      <pointsMaterial
        color="#a3ff12"
        size={0.09}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
      />
    </points>
  );
}
