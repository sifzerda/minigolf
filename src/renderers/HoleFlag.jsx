// src/renderers/HoleFlag.jsx

import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function HoleFlag({
  position,
  color = "#ff4545",
  height = 1.8,
}) {
  const flagRef = useRef(null);

  const geometry = useMemo(() => {
    const shape = new THREE.PlaneGeometry(
      0.9,
      0.45,
      12,
      4
    );

    shape.translate(0.45, 0, 0);

    shape.attributes.position.setUsage(
      THREE.DynamicDrawUsage
    );

    return shape;
  }, []);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame(({ clock }) => {
    if (!flagRef.current) return;

    const time = clock.getElapsedTime();
    const positions = geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);

      positions.setZ(
        i,
        Math.sin(time * 3 + x * 7) * 0.08 * x
      );
    }

    positions.needsUpdate = true;
  });

  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry
          args={[0.025, 0.025, height, 8]}
        />
        <meshStandardMaterial
          color="#dddddd"
          metalness={0.65}
          roughness={0.3}
        />
      </mesh>

      <mesh
        ref={flagRef}
        geometry={geometry}
        position={[0, height - 0.25, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={color}
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>

      <mesh position={[0, height + 0.04, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial
          color="#ffd700"
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}
