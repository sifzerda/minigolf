// src/renderers/LoopObstacle.jsx

import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, DoubleSide, Vector3 } from "three";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";

const TAU = Math.PI * 2;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// A strip mesh is used for both the rendered track and its exact static collider.
function stripGeometry(left, right) {
  const vertices = [];
  const indices = [];
  for (let i = 0; i < left.length; i++) {
    vertices.push(...left[i].toArray(), ...right[i].toArray());
    if (i) {
      const a = (i - 1) * 2, b = i * 2;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return { geometry, vertices: new Float32Array(vertices), indices: new Uint32Array(indices) };
}

function buildTrack(entity, mode) {
  const radius = Math.max(0.8, entity.radius ?? 1.6);
  const width = Math.max(0.65, entity.width ?? 1.3);
  const samples = clamp(Math.floor(entity.segments ?? 96), 32, 256);
  const railHeight = Math.max(0.08, entity.railHeight ?? 0.3);
  const approach = Math.max(0, entity.approachLength ?? 1.5);
  const departure = Math.max(0, entity.departureLength ?? 1.5);
  const rise = mode === "inclinedLoop" ? Math.max(0.25, entity.rise ?? 1.1) : 0;
  const offset = Math.max(2.5, entity.exitOffset ?? 3.6);
  const groundY = entity.groundY ?? 0.04;

  function core(t) {
    const a = TAU * t;
    if (mode === "verticalLoop") {
      return new Vector3(0, groundY + radius * (1 - Math.cos(a)), -radius * Math.sin(a) - offset * t);
    }
    // Horizontal loop: an offset full circle creates separate entrance and exit lanes.
    return new Vector3(radius * Math.sin(a), groundY + rise * t, radius * (1 - Math.cos(a)) - offset * t);
  }
  const start = core(0), end = core(1);
  const tangentStart = core(0.0001).sub(start).normalize();
  const tangentEnd = end.clone().sub(core(0.9999)).normalize();
  const centers = [];
  const sections = Math.max(4, Math.round(samples * 0.15));
  for (let i = sections; i >= 1; i--) {
    centers.push(start.clone().addScaledVector(tangentStart, -approach * i / sections));
  }
  for (let i = 0; i <= samples; i++) centers.push(core(i / samples));
  for (let i = 1; i <= sections; i++) {
    const p = end.clone().addScaledVector(tangentEnd, departure * i / sections);
    // The elevated exit descends to ground, so it remains playable.
    if (mode === "inclinedLoop") p.y -= rise * (i / sections);
    centers.push(p);
  }

  const left = [], right = [], railLTop = [], railRTop = [];
  for (let i = 0; i < centers.length; i++) {
    const prev = centers[Math.max(0, i - 1)];
    const next = centers[Math.min(centers.length - 1, i + 1)];
    const tangent = next.clone().sub(prev).normalize();
    let across;
    if (mode === "verticalLoop") {
      across = new Vector3(1, 0, 0);
    } else {
      across = new Vector3(tangent.z, 0, -tangent.x).normalize();
      if (across.lengthSq() < 0.1) across.set(1, 0, 0);
    }
    const normal = mode === "verticalLoop"
      ? new Vector3(0, -tangent.z, tangent.y).normalize()
      : new Vector3(0, 1, 0);
    const l = centers[i].clone().addScaledVector(across, width / 2);
    const r = centers[i].clone().addScaledVector(across, -width / 2);
    left.push(l); right.push(r);
    railLTop.push(l.clone().addScaledVector(normal, railHeight));
    railRTop.push(r.clone().addScaledVector(normal, railHeight));
  }
  return {
    deck: stripGeometry(left, right),
    leftRail: stripGeometry(left, railLTop),
    rightRail: stripGeometry(right, railRTop),
    centerPoints: centers,
    radius,
  };
}

function TrackPart({ part, color, friction, restitution, metalness = 0.1 }) {
  return (
    <>
      <TrimeshCollider args={[part.vertices, part.indices]} friction={friction} restitution={restitution} />
      <mesh geometry={part.geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} side={DoubleSide} metalness={metalness} roughness={0.6} />
      </mesh>
    </>
  );
}

export default function LoopObstacle({ entity, mode }) {
  const track = useMemo(() => buildTrack(entity, mode), [entity, mode]);
  const friction = entity.friction ?? 0.65;
  const restitution = entity.restitution ?? 0.08;
  const color = entity.color ?? (mode === "verticalLoop" ? "#f4c542" : mode === "inclinedLoop" ? "#ef4444" : "#facc15");
  return (
    <RigidBody type="fixed" colliders={false} position={entity.position ?? [0, 0, 0]} rotation={entity.rotation ?? [0, 0, 0]}>
      <TrackPart part={track.deck} color={color} friction={friction} restitution={restitution} />
      {entity.rails !== false && (
        <>
          <TrackPart part={track.leftRail} color={entity.railColor ?? color} friction={friction} restitution={restitution} />
          <TrackPart part={track.rightRail} color={entity.railColor ?? color} friction={friction} restitution={restitution} />
        </>
      )}
    </RigidBody>
  );
}

export function VerticalLoop({ entity }) { return <LoopObstacle entity={entity} mode="verticalLoop" />; }
export function HorizontalLoop({ entity }) { return <LoopObstacle entity={entity} mode="horizontalLoop" />; }
export function InclinedLoop({ entity }) { return <LoopObstacle entity={entity} mode="inclinedLoop" />; }
