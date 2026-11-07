// src/renderers/AnimatedDecoration.jsx

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export default function AnimatedDecoration({
  type,
  position,
  index = 0,
}) {
  const groupRef = useRef(null);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    const time = clock.getElapsedTime();
    const phase = index * 0.8;

    if (type === "trees" || type === "pine") {
      group.rotation.z =
        Math.sin(time * 0.8 + phase) * 0.025;

      group.rotation.x =
        Math.cos(time * 0.65 + phase) * 0.015;
    }

    if (type === "cactus") {
      group.rotation.z =
        Math.sin(time * 0.35 + phase) * 0.006;
    }

    if (type === "crystals") {
      group.rotation.y = time * 0.3 + phase;

      group.position.y =
        position[1] +
        Math.sin(time * 1.5 + phase) * 0.15;
    }

    if (type === "rocks") {
      group.rotation.set(0, 0, 0);
    }
  });

  const materials = {
    trees: "#367b42",
    pine: "#356b62",
    cactus: "#43834c",
    rocks: "#454046",
    crystals: "#00e5ff",
  };

  const color = materials[type] ?? "#777777";

  return (
    <group ref={groupRef} position={position}>
      {(type === "trees" || type === "pine") && (
        <>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry
              args={[0.12, 0.18, 1.4, 8]}
            />
            <meshStandardMaterial color="#65432e" />
          </mesh>

          <mesh position={[0, 1.8, 0]} castShadow>
            <coneGeometry
              args={[
                type === "pine" ? 0.8 : 1,
                2.4,
                8,
              ]}
            />
            <meshStandardMaterial color={color} />
          </mesh>
        </>
      )}

      {type === "cactus" && (
        <>
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry
              args={[0.25, 0.3, 1.8, 8]}
            />
            <meshStandardMaterial color={color} />
          </mesh>

          <mesh position={[0.4, 1.1, 0]} castShadow>
            <boxGeometry args={[0.7, 0.2, 0.25]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </>
      )}

      {type === "rocks" && (
        <mesh position={[0, 0.5, 0]} castShadow>
          <dodecahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial
            color={color}
            roughness={1}
          />
        </mesh>
      )}

      {type === "crystals" && (
        <mesh position={[0, 0.9, 0]} castShadow>
          <octahedronGeometry args={[0.65, 0]} />
          <meshStandardMaterial
            color={color}
            emissive="#00aacc"
            emissiveIntensity={1.5}
            metalness={0.3}
          />
        </mesh>
      )}
    </group>
  );
}
