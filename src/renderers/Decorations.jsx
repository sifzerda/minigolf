// src/renderers/Decorations.jsx:

import { memo, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { useGamePaused } from "../context/GamePauseContext";

const COUNT = 20;
const TAU = Math.PI * 2;

const COLORS = {
  trees: "#367b42",
  pine: "#356b62",
  cactus: "#43834c",
  rocks: "#454046",
  crystals: "#00e5ff",
};

const POSITIONS = Array.from({ length: COUNT }, (_, index) => {
  const angle = (index / COUNT) * TAU;
  const radius = 18 + (index % 3) * 3;

  return [
    Math.cos(angle) * radius,
    0,
    Math.sin(angle) * radius,
  ];
});

const CONFIG = {
  trees: {
    primary: {
      geometry: new THREE.ConeGeometry(1, 2.4, 8),
      offset: [0, 1.8, 0],
    },
    secondary: {
      geometry: new THREE.CylinderGeometry(0.12, 0.18, 1.4, 8),
      offset: [0, 0.7, 0],
    },
  },

  pine: {
    primary: {
      geometry: new THREE.ConeGeometry(0.8, 2.4, 8),
      offset: [0, 1.8, 0],
    },
    secondary: {
      geometry: new THREE.CylinderGeometry(0.12, 0.18, 1.4, 8),
      offset: [0, 0.7, 0],
    },
  },

  cactus: {
    primary: {
      geometry: new THREE.CylinderGeometry(0.25, 0.3, 1.8, 8),
      offset: [0, 0.9, 0],
    },
    secondary: {
      geometry: new THREE.BoxGeometry(0.7, 0.2, 0.25),
      offset: [0.4, 1.1, 0],
    },
  },

  rocks: {
    primary: {
      geometry: new THREE.DodecahedronGeometry(0.8, 0),
      offset: [0, 0.5, 0],
    },
  },

  crystals: {
    primary: {
      geometry: new THREE.OctahedronGeometry(0.65, 0),
      offset: [0, 0.9, 0],
    },
  },
};

const MATERIALS = {
  trunk: new THREE.MeshStandardMaterial({
    color: "#65432e",
  }),
};

for (const [type, color] of Object.entries(COLORS)) {
  MATERIALS[type] = new THREE.MeshStandardMaterial({
    color,
    roughness: type === "rocks" ? 1 : 0.9,
    metalness: type === "crystals" ? 0.3 : 0,
    emissive: type === "crystals" ? "#00aacc" : "#000000",
    emissiveIntensity: type === "crystals" ? 1.5 : 0,
  });
}

const TEMP_GROUP = new THREE.Object3D();
const TEMP_PART = new THREE.Object3D();

function updateInstance(mesh, index, position, rotation, offset) {
  if (!mesh) return;

  TEMP_GROUP.position.set(...position);
  TEMP_GROUP.rotation.set(...rotation);
  TEMP_GROUP.scale.set(1, 1, 1);
  TEMP_GROUP.updateMatrix();

  TEMP_PART.position.set(...offset);
  TEMP_PART.rotation.set(0, 0, 0);
  TEMP_PART.scale.set(1, 1, 1);
  TEMP_PART.updateMatrix();

  const matrix = new THREE.Matrix4().multiplyMatrices(
    TEMP_GROUP.matrix,
    TEMP_PART.matrix
  );

  mesh.setMatrixAt(index, matrix);
}

function Decorations({ type = "trees" }) {
  const primaryRef = useRef(null);
  const secondaryRef = useRef(null);
  const paused = useGamePaused();
  const animationTime = useRef(0);
  const config = CONFIG[type] ?? CONFIG.trees;

  const animated = type !== "rocks";

  const update = (time) => {
    const primary = primaryRef.current;
    const secondary = secondaryRef.current;

    if (!primary) return;

    for (let index = 0; index < COUNT; index++) {
      const position = POSITIONS[index];
      const phase = index * 0.8;

      let rotationX = 0;
      let rotationY = 0;
      let rotationZ = 0;
      let offsetY = 0;

      if (type === "trees" || type === "pine") {
        rotationZ = Math.sin(time * 0.8 + phase) * 0.025;
        rotationX = Math.cos(time * 0.65 + phase) * 0.015;
      }

      if (type === "cactus") {
        rotationZ = Math.sin(time * 0.35 + phase) * 0.006;
      }

      if (type === "crystals") {
        rotationY = time * 0.3 + phase;
        offsetY = Math.sin(time * 1.5 + phase) * 0.15;
      }

      const worldPosition = [
        position[0],
        position[1] + offsetY,
        position[2],
      ];

      const rotation = [rotationX, rotationY, rotationZ];

      updateInstance(
        primary,
        index,
        worldPosition,
        rotation,
        config.primary.offset
      );

      if (config.secondary) {
        updateInstance(
          secondary,
          index,
          worldPosition,
          rotation,
          config.secondary.offset
        );
      }
    }

    primary.instanceMatrix.needsUpdate = true;

    if (secondary) {
      secondary.instanceMatrix.needsUpdate = true;
    }
  };

  useLayoutEffect(() => {
    update(0);
  }, [type]);

  useFrame((_, delta) => {
    if (paused || !animated) return;

    animationTime.current += Math.min(delta, 0.05);

    update(animationTime.current);
  });

  const secondaryMaterial =
    type === "trees" || type === "pine"
      ? MATERIALS.trunk
      : MATERIALS[type];

  return (
    <>
      <instancedMesh
        ref={primaryRef}
        args={[config.primary.geometry, MATERIALS[type], COUNT]}
        castShadow
        frustumCulled={false}
      />

      {config.secondary && (
        <instancedMesh
          ref={secondaryRef}
          args={[
            config.secondary.geometry,
            secondaryMaterial,
            COUNT,
          ]}
          castShadow
          frustumCulled={false}
        />
      )}
    </>
  );
}

export default memo(Decorations);
