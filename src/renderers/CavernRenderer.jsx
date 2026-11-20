import { useEffect, useMemo } from "react";
import { RigidBody, TrimeshCollider, BallCollider } from "@react-three/rapier";
import { BufferGeometry, Float32BufferAttribute, DoubleSide, Euler, Vector3 } from "three";
import useGameStore from "../store/useGameStore";
import { createSolidWithTunnels, getTunnelPoints } from "../terrain/createSolidWithTunnels";

// Existing course05 / old course06 geometry remains available when mass is omitted.
function legacyArch({ width, height, length, openingWidth, openingHeight, segments, rings, seed }) {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const vertices = [];
  const indices = [];
  const burial = 0.6;
  const stride = segments + 1;
  const layerSize = (rings + 1) * stride;
  const at = (layer, ring, segment) => layer * layerSize + ring * stride + segment;
  const quad = (a, b, c, d) => indices.push(a, b, c, a, c, d);

  for (let layer = 0; layer < 2; layer++) {
    const inner = layer === 1;
    const rx = (inner ? openingWidth : width) / 2;
    const ry = (inner ? openingHeight : height) + burial;
    for (let ring = 0; ring <= rings; ring++) {
      const z = (ring / rings - 0.5) * length;
      for (let s = 0; s <= segments; s++) {
        const theta = s / segments * Math.PI;
        const variation = inner ? 1 : 0.85 + random() * 0.3;
        vertices.push(Math.cos(theta) * rx * variation, Math.sin(theta) * ry * variation - burial, z);
      }
    }
  }
  for (let ring = 0; ring < rings; ring++) {
    for (let s = 0; s < segments; s++) {
      const a = at(0, ring, s);
      quad(a, a + 1, a + stride + 1, a + stride);
      const b = a + layerSize;
      quad(b, b + stride, b + stride + 1, b + 1);
    }
  }
  for (let s = 0; s < segments; s++) {
    const a = at(0, 0, s);
    quad(a, a + layerSize, a + layerSize + 1, a + 1);
    const b = at(0, rings, s);
    quad(b, b + 1, b + layerSize + 1, b + layerSize);
  }
  for (let ring = 0; ring < rings; ring++) {
    const a = at(0, ring, 0);
    quad(a, a + stride, a + stride + layerSize, a + layerSize);
    const b = at(0, ring, segments);
    quad(b, b + layerSize, b + stride + layerSize, b + stride);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return {
    geometry,
    collider: [new Float32Array(vertices), new Uint32Array(indices)],
  };
}

const portalMappings = new Map();

function mappingFor(group, sessionId, count) {
  const current = portalMappings.get(group);
  if (current?.sessionId === sessionId && current.count === count) return current.mapping;
  const mapping = Array.from({ length: count }, (_, i) => i);
  for (let i = mapping.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mapping[i], mapping[j]] = [mapping[j], mapping[i]];
  }
  portalMappings.set(group, { sessionId, count, mapping });
  return mapping;
}

const vec = (p) => new Vector3(...p);

function portalSensors(entity, length, openingHeight) {
  if (!entity.mass) {
    return entity.portal ? [{
      portal: entity.portal,
      position: [0, openingHeight / 2, length / 2 - 0.7],
      radius: Math.min(entity.openingWidth ?? 1.9, openingHeight) * 0.35,
      direction: [0, 0, -1],
    }] : [];
  }

  return (entity.tunnels ?? []).filter((tunnel) => tunnel.portal).map((tunnel) => {
    const points = getTunnelPoints(tunnel);
    const direction = vec(points[1]).sub(vec(points[0])).normalize();
    const portal = tunnel.portal;
    const position = portal.sensorPosition ?? vec(points[0])
      .addScaledVector(direction, portal.sensorOffset ?? 1.2).toArray();
    return {
      portal,
      position,
      radius: portal.sensorRadius ?? (tunnel.radius ?? 0.8) * 0.65,
      direction: direction.toArray(),
    };
  });
}

export default function CavernRenderer({ entity, ballRef, paused = false }) {
  const {
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    size = [6, 3.6, 6.5],
    openingWidth = 1.9,
    openingHeight = 1.7,
    segments = 12,
    rings = 6,
    seed = 105,
    color = "#82796b",
    friction = 0.85,
    restitution = 0.2,
  } = entity;
  const [width, height, length] = size;

  const built = useMemo(() => entity.mass
    ? createSolidWithTunnels(entity.mass, entity.tunnels ?? [])
    : legacyArch({ width, height, length, openingWidth, openingHeight, segments, rings, seed }),
  [entity.mass, entity.tunnels, width, height, length, openingWidth, openingHeight, segments, rings, seed]);

  useEffect(() => () => built.geometry.dispose(), [built]);

  const sensors = useMemo(
    () => portalSensors(entity, length, openingHeight),
    [entity.mass, entity.tunnels, entity.portal, entity.openingWidth, length, openingHeight]
  );

  function enterPortal(event, sensor) {
    if (paused) return;
    const ball = event.other.rigidBody;
    const object = event.other.rigidBodyObject;
    if (!ball || !(
      object?.userData?.isGolfBall || ball.userData?.isGolfBall ||
      (ballRef?.current && ball.handle === ballRef.current.handle)
    )) return;

    const store = useGameStore.getState();
    if (store.completed || store.gameComplete) return;

    const v = ball.linvel();
    const worldDir = new Vector3(...sensor.direction)
      .applyEuler(new Euler(...rotation));
    if (sensor.portal.requireForward !== false &&
        v.x * worldDir.x + v.y * worldDir.y + v.z * worldDir.z < 0.05) return;

    const exits = sensor.portal.exits ?? [];
    if (!exits.length) return;
    const mapping = mappingFor(
      sensor.portal.group ?? entity.id ?? "cavern",
      store.sessionId,
      exits.length
    );
    const index = mapping[sensor.portal.entranceIndex ?? 0];
    const exit = exits[index];
    if (!exit) return;

    const [x, y, z] = exit.position;
    const [vx, vy, vz] = exit.velocity ?? [0, 0, 0];
    ball.setTranslation({ x, y, z }, true);
    ball.resetForces(true);
    ball.resetTorques(true);
    ball.setLinvel({ x: vx, y: vy, z: vz }, true);
    ball.setAngvel({ x: 0, y: 0, z: 0 }, true);
    ball.wakeUp();
  }

  return (
    <RigidBody type="fixed" colliders={false} position={position} rotation={rotation}>
      <TrimeshCollider args={built.collider} friction={friction} restitution={restitution} />
      <mesh geometry={built.geometry} castShadow receiveShadow>
        <meshStandardMaterial color={color} side={DoubleSide} roughness={1} flatShading />
      </mesh>
      {sensors.map((sensor, i) => (
        <BallCollider
          key={i}
          sensor
          position={sensor.position}
          args={[sensor.radius]}
          onIntersectionEnter={(event) => enterPortal(event, sensor)}
        />
      ))}
    </RigidBody>
  );
}
