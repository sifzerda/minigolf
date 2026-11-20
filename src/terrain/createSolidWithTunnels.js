import {
  BoxGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  SphereGeometry,
  Vector3,
} from "three";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";

const UP = new Vector3(0, 1, 0);
const FORWARD = new Vector3(0, 0, 1);

const vector = (point) => new Vector3(...point);

function makeMassGeometry(mass) {
  if (mass.geometry?.isBufferGeometry) {
    // Custom geometry must be watertight and based at local Y=0.
    return mass.geometry.clone();
  }

  const [width, height, length] = mass.size ?? [6, 3.5, 6];
  if (![width, height, length].every((v) => Number.isFinite(v) && v > 0)) {
    throw new Error("Cavern mass.size must contain three positive dimensions");
  }

  let geometry;
  switch (mass.shape ?? "box") {
    case "box":
      geometry = new BoxGeometry(width, height, length);
      break;
    case "ellipsoid":
      geometry = new SphereGeometry(1, 32, 20);
      geometry.scale(width / 2, height / 2, length / 2);
      break;
    case "rock": {
      geometry = new IcosahedronGeometry(1, 2);
      const positions = geometry.getAttribute("position");
      const seed = mass.seed ?? 1;
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        // Coordinate-derived variation is identical at shared seam vertices.
        const variation = 1 + 0.065 * Math.sin(
          x * 11.7 + y * 8.2 + z * 5.3 + seed
        ) * Math.sin(x * 7.3 - y * 10.1 + z * 13.4);
        positions.setXYZ(i, x * variation, y * variation, z * variation);
      }
      geometry.scale(width / 2, height / 2, length / 2);
      geometry.computeVertexNormals();
      break;
    }
    case "cylinder":
      geometry = new CylinderGeometry(width / 2, width / 2, height, 32);
      geometry.scale(1, 1, length / width);
      break;
    default:
      throw new Error(`Unsupported cavern mass shape: ${mass.shape}`);
  }

  // All generated masses sit on a plane at local Y=0.
  geometry.translate(0, height / 2, 0);
  return geometry;
}

function makeCutterGeometry(from, to, tunnel) {
  const a = vector(from);
  const b = vector(to);
  const direction = b.clone().sub(a);
  const distance = direction.length();
  if (distance < 0.01) throw new Error("Tunnel segment is too short");

  let geometry;
  if ((tunnel.shape ?? "round") === "rect") {
    const width = tunnel.width ?? 1.5;
    const height = tunnel.height ?? 1.5;
    if (!(width > 0 && height > 0)) throw new Error("Invalid tunnel width/height");
    geometry = new BoxGeometry(width, height, distance);
    geometry.applyMatrix4(new Matrix4().makeRotationFromQuaternion(
      new Quaternion().setFromUnitVectors(FORWARD, direction.normalize())
    ));
  } else if ((tunnel.shape ?? "round") === "round") {
    const radius = tunnel.radius ?? 0.8;
    if (!(radius > 0)) throw new Error("Tunnel radius must be positive");
    geometry = new CylinderGeometry(radius, radius, distance, tunnel.segments ?? 24);
    geometry.applyMatrix4(new Matrix4().makeRotationFromQuaternion(
      new Quaternion().setFromUnitVectors(UP, direction.normalize())
    ));
  } else {
    throw new Error(`Unsupported tunnel shape: ${tunnel.shape}`);
  }
  geometry.translate(...a.add(b).multiplyScalar(0.5).toArray());
  return geometry;
}

export function getTunnelPoints(tunnel) {
  const points = tunnel.path ?? (tunnel.from && tunnel.to ? [tunnel.from, tunnel.to] : null);
  if (!Array.isArray(points) || points.length < 2 ||
      points.some((p) => !Array.isArray(p) || p.length !== 3 || !p.every(Number.isFinite))) {
    throw new Error("Every tunnel needs from/to or a path of [x,y,z] points");
  }
  if (tunnel.shape === "rect" && points.length !== 2) {
    throw new Error("Rectangular tunnels currently support one straight segment");
  }
  return points;
}

function colliderFromGeometry(geometry) {
  const position = geometry.getAttribute("position");
  if (!position) throw new Error("CSG result is missing positions");

  // CSG may use drawRange; collider must match the visible triangles.
  const index = geometry.getIndex();
  const raw = index?.array;
  const total = index ? index.count : position.count;
  const start = Math.min(total, Math.max(0, geometry.drawRange.start || 0));
  const count = Number.isFinite(geometry.drawRange.count)
    ? Math.max(0, Math.min(geometry.drawRange.count, total - start))
    : total - start;
  const triangleCount = Math.floor(count / 3);
  if (!triangleCount) throw new Error("CSG produced an empty mesh");

  const vertices = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    vertices[i * 3] = position.getX(i);
    vertices[i * 3 + 1] = position.getY(i);
    vertices[i * 3 + 2] = position.getZ(i);
  }
  const indices = new Uint32Array(triangleCount * 3);
  for (let i = 0; i < indices.length; i++) {
    indices[i] = raw ? raw[start + i] : start + i;
  }
  return [vertices, indices];
}

/**
 * Boolean-subtract holes/tunnels from a watertight solid.
 * Tunnel coordinates are local to the CavernRenderer position, measured from its base.
 * Returns the same { geometry, collider } contract as the legacy cavern builder.
 */
export function createSolidWithTunnels(mass, tunnels = []) {
  const evaluator = new Evaluator();
  evaluator.useGroups = false;
  evaluator.attributes = ["position", "normal"];

  const base = new Brush(makeMassGeometry(mass));
  base.updateMatrixWorld(true);
  let current = base;

  function subtract(geometry) {
    const tool = new Brush(geometry);
    tool.updateMatrixWorld(true);
    const previous = current;
    try {
      current = evaluator.evaluate(previous, tool, SUBTRACTION);
      if (previous !== base) previous.geometry.dispose();
    } finally {
      tool.geometry.dispose();
    }
  }

  try {
    for (const tunnel of tunnels) {
      const points = getTunnelPoints(tunnel);
      for (let i = 0; i < points.length - 1; i++) {
        subtract(makeCutterGeometry(points[i], points[i + 1], tunnel));
      }
      // A round chamber at each bend ensures adjacent bores connect.
      if ((tunnel.shape ?? "round") === "round") {
        for (let i = 1; i < points.length - 1; i++) {
          const radius = tunnel.radius ?? 0.8;
          const joint = new SphereGeometry(radius, 20, 12);
          joint.translate(...points[i]);
          subtract(joint);
        }
      }
    }
    if (current !== base) base.geometry.dispose();
    const geometry = current.geometry;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    return { geometry, collider: colliderFromGeometry(geometry) };
  } catch (error) {
    current.geometry.dispose();
    if (current !== base) base.geometry.dispose();
    throw error;
  }
}
