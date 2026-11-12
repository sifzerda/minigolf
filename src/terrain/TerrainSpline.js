// src/terrain/TerrainSpline.js

import * as THREE from "three";

const clamp = (value, min, max) =>
    Math.max(min, Math.min(max, value));

export function smoothstep(value) {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
}

export function createTerrainSpline(feature) {
    const points = feature.points;

    if (
        !Array.isArray(points) ||
        points.length < 2 ||
        points.some(
            (p) =>
                !Array.isArray(p) ||
                !Number.isFinite(p[0]) ||
                !Number.isFinite(p[1])
        )
    ) {
        throw new Error(
            "Terrain spline requires two valid [x,z] points"
        );
    }

    const curve = new THREE.CatmullRomCurve3(
        points.map(
            ([x, z]) => new THREE.Vector3(x, 0, z)
        ),
        false,
        "centripetal"
    );

    return {
        samples: curve.getPoints(
            Math.max(
                32,
                Math.floor(
                    feature.samples ?? points.length * 32
                )
            )
        ),
        width: Math.max(0.01, feature.width ?? 3),
        edgeWidth: Math.max(
            0.001,
            feature.edgeWidth ?? 1
        ),
        height: feature.height ?? 2,
        startHeight: feature.startHeight,
        endHeight: feature.endHeight,
    };
}

export function sampleTerrainSpline(x, z, spline) {
    let best = Infinity;
    let progress = 0;

    const points = spline.samples;
    const count = points.length - 1;

    for (let i = 0; i < count; i++) {
        const a = points[i];
        const b = points[i + 1];

        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const lengthSquared = dx * dx + dz * dz;

        const t = lengthSquared
            ? clamp(
                (
                    (x - a.x) * dx +
                    (z - a.z) * dz
                ) / lengthSquared,
                0,
                1
            )
            : 0;

        const px = a.x + dx * t;
        const pz = a.z + dz * t;

        const distanceSquared =
            (x - px) ** 2 +
            (z - pz) ** 2;

        if (distanceSquared < best) {
            best = distanceSquared;
            progress = (i + t) / count;
        }
    }

    const distance = Math.sqrt(best);

    return {
        distance,
        progress,
        influence:
            1 -
            smoothstep(
                (distance - spline.width / 2) /
                spline.edgeWidth
            ),
        height:
            (spline.startHeight ?? spline.height) +
            (
                (spline.endHeight ?? spline.height) -
                (spline.startHeight ?? spline.height)
            ) * progress,
    };
}
