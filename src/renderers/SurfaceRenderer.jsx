// src/renderers/SurfaceRenderer.jsx

export default function SurfaceRenderer({ entity }) {
  const [width, length] = entity.size;

  return (
    <mesh
      position={[
        entity.position[0],
        0.012,
        entity.position[2],
      ]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[width, length]} />

      <meshStandardMaterial
        color={entity.color}
        roughness={
          entity.surface === "ice" ? 0.15 : 0.95
        }
        metalness={
          entity.surface === "ice" ? 0.2 : 0
        }
      />
    </mesh>
  );
}
