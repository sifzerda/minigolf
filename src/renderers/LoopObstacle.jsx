import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, DoubleSide, Vector3 } from "three";
import { RigidBody, TrimeshCollider } from "@react-three/rapier";
import { createLoopPath } from "../terrain/loopTrack.js";

const EPS = 1e-8;

function makeStrip(left, right, desiredNormals) {
  const vertices = [];
  const indices = [];

  for (let i = 0; i < left.length; i++) {
    vertices.push(left[i].x, left[i].y, left[i].z, right[i].x, right[i].y, right[i].z);
  }

  for (let i = 0; i < left.length - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    const forward = left[i + 1].clone().sub(left[i]);
    const across = right[i].clone().sub(left[i]);
    const winding = forward.cross(across).dot(desiredNormals[i]);

    if (winding >= 0) indices.push(a, c, b, b, c, d);
    else indices.push(a, b, c, b, d, c);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return {
    geometry,
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
  };
}

function makeTrack(centerline, mode, width, railHeight) {
  const vertical = mode === "verticalLoop";
  const left = [], right = [], leftTop = [], rightTop = [];
  const deckNormals = [], leftNormals = [], rightNormals = [];

  for (let i = 0; i < centerline.length; i++) {
    const before = centerline[Math.max(0, i - 1)];
    const after = centerline[Math.min(centerline.length - 1, i + 1)];
    const tangent = after.clone().sub(before).normalize();

    let across, up;
    if (vertical) {
      across = new Vector3(1, 0, 0);
      up = across.clone().cross(tangent).normalize();
    } else {
      across = new Vector3(tangent.z, 0, -tangent.x);
      if (across.lengthSq() < EPS) across.set(-1, 0, 0);
      across.normalize();
      up = tangent.clone().cross(across).normalize();
      if (up.y < 0) {
        across.negate();
        up.negate();
      }
    }

    const l = centerline[i].clone().addScaledVector(across, width / 2);
    const r = centerline[i].clone().addScaledVector(across, -width / 2);
    left.push(l);
    right.push(r);
    leftTop.push(l.clone().addScaledVector(up, railHeight));
    rightTop.push(r.clone().addScaledVector(up, railHeight));
    deckNormals.push(up);
    leftNormals.push(across);
    rightNormals.push(across.clone().negate());
  }

  return {
    deck: makeStrip(left, right, deckNormals),
    leftRail: makeStrip(left, leftTop, leftNormals),
    rightRail: makeStrip(right, rightTop, rightNormals),
  };
}

function TrackPart({ part, color, friction, restitution }) {
  return (
    <>
      <TrimeshCollider
        args={[part.vertices, part.indices]}
        friction={friction}
        restitution={restitution}
      />
      <mesh geometry={part.geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          side={DoubleSide}
          roughness={0.65}
          metalness={0.1}
        />
      </mesh>
    </>
  );
}

export default function LoopObstacle({ entity, mode }) {
  // Rebuild only when the obstacle configuration changes.
  // Course definitions are static, so this normally runs just once.
  const track = useMemo(() => {
    const points = createLoopPath(entity, mode);
    return makeTrack(
      points,
      mode,
      Math.max(0.65, entity.width ?? 1.3),
      Math.max(0.08, entity.railHeight ?? 0.3)
    );
  }, [entity, mode]);

  useEffect(() => () => {
    track.deck.geometry.dispose();
    track.leftRail.geometry.dispose();
    track.rightRail.geometry.dispose();
  }, [track]);

  const color = entity.color ?? (
    mode === "verticalLoop" ? "#f4c542" :
    mode === "inclinedLoop" ? "#ef4444" : "#facc15"
  );
  const friction = entity.friction ?? 0.65;
  const restitution = entity.restitution ?? 0.08;

  return (
    <RigidBody
      type="fixed"
      colliders={false}
      position={entity.position ?? [0, 0, 0]}
      rotation={entity.rotation ?? [0, 0, 0]}
    >
      <TrackPart
        part={track.deck}
        color={color}
        friction={friction}
        restitution={restitution}
      />
      {entity.rails !== false && (
        <>
          <TrackPart
            part={track.leftRail}
            color={entity.railColor ?? color}
            friction={friction}
            restitution={restitution}
          />
          <TrackPart
            part={track.rightRail}
            color={entity.railColor ?? color}
            friction={friction}
            restitution={restitution}
          />
        </>
      )}
    </RigidBody>
  );
}

export function VerticalLoop({ entity }) {
  return <LoopObstacle entity={entity} mode="verticalLoop" />;
}

export function HorizontalLoop({ entity }) {
  return <LoopObstacle entity={entity} mode="horizontalLoop" />;
}

export function InclinedLoop({ entity }) {
  return <LoopObstacle entity={entity} mode="inclinedLoop" />;
}
