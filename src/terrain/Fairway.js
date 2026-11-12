// src/terrain/Fairway.js

import * as THREE from "three";

export function createFairwaySampler(fairway) {
  if (!fairway?.points || fairway.points.length < 2) {
    return null;
  }

  const points = fairway.points.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const samples = curve.getPoints(Math.max(32, points.length * 24));

  return {
    points: samples,
    width: fairway.width ?? 3,
    flatten: fairway.flatten ?? 0.8,
    shoulder: fairway.shoulder ?? 2,
  };
}

export function getFairwayInfluence(x, z, sampler) {
  if (!sampler) return 0;

  let nearest = Infinity;

  for (let i = 1; i < sampler.points.length; i++) {
    const a = sampler.points[i - 1];
    const b = sampler.points[i];

    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const lengthSquared = dx * dx + dz * dz;

    const t = lengthSquared > 0 ? Math.max(0,  Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / lengthSquared)) : 0;

    const px = a.x + dx * t;
    const pz = a.z + dz * t;

    nearest = Math.min(nearest, Math.hypot(x - px, z - pz));
  }

  const halfWidth = sampler.width / 2;

  if (nearest <= halfWidth) return 1;

  const t = Math.max(0, Math.min(1, (nearest - halfWidth) / Math.max(0.001, sampler.shoulder)));

  return 1 - t * t * (3 - 2 * t);
}
