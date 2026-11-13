// src/renderers/HoleFlag.jsx

import { DoubleSide } from "three";

export default function HoleFlag({
  position,
  color = "#ff4545",
  height = 4,
}) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.025, height, 8]} />
        <meshStandardMaterial color="#dddddd" metalness={0.65} />
      </mesh>

      <mesh position={[0.45, height - 0.25, 0]} castShadow>
        <planeGeometry args={[0.9, 0.45]} />
        <meshStandardMaterial color={color} side={DoubleSide} />
      </mesh>

      <mesh position={[0, height + 0.04, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.7} />
      </mesh>
    </group>
  );
}
