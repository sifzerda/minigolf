// src/renderers/LightingRenderer.jsx

import { getEnvironment } from "../ecs/constants/environments";

const LIGHTING = {
  garden: {
    sunPosition: [12, 22, 10],
    sunColor: "#fff4dc",
    ambientColor: "#d9ecff",
  },
  desert: {
    sunPosition: [15, 25, 8],
    sunColor: "#ffe0a6",
    ambientColor: "#ffe9c8",
  },
  snow: {
    sunPosition: [8, 18, 12],
    sunColor: "#f5fbff",
    ambientColor: "#c7e5ff",
  },
  volcanic: {
    sunPosition: [6, 12, -8],
    sunColor: "#ff7848",
    ambientColor: "#8c7a8d",
  },
  neon: {
    sunPosition: [10, 16, 8],
    sunColor: "#50dfff",
    ambientColor: "#7585ff",
  },
};

export default function LightingRenderer({
  theme = "garden",
}) {
  const environment = getEnvironment(theme);
  const config = LIGHTING[theme] ?? LIGHTING.garden;

  return (
    <>
      <ambientLight
        color={config.ambientColor}
        intensity={environment.ambient * 0.6}
      />

      <hemisphereLight
        args={[
          config.ambientColor,
          environment.ground,
          environment.ambient * 0.5,
        ]}
      />

      <directionalLight
        position={config.sunPosition}
        color={config.sunColor}
        intensity={environment.sun}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-normalBias={0.02}
      />

      {theme === "neon" && (
        <>
          <pointLight
            position={[-8, 5, -8]}
            color="#00e5ff"
            intensity={30}
            distance={20}
            decay={2}
          />

          <pointLight
            position={[8, 5, 8]}
            color="#ff00cc"
            intensity={25}
            distance={20}
            decay={2}
          />
        </>
      )}

      {theme === "volcanic" && (
        <pointLight
          position={[0, 2, -10]}
          color="#ff4500"
          intensity={25}
          distance={25}
          decay={2}
        />
      )}
    </>
  );
}
