// src/renderers/EnvironmentRenderer.jsx

import { useMemo } from "react";
import { getEnvironment } from "../ecs/constants/environments";
import LightingRenderer from "./LightingRenderer";
import AnimatedDecoration from "./AnimatedDecoration";

    if (type === "cactus") {
        return (
            <group position={position}>
                <mesh position={[0, 0.9, 0]} castShadow>
                    <cylinderGeometry args={[0.25, 0.3, 1.8, 8]} />
                    <meshStandardMaterial color="#43834c" />
                </mesh>

                <mesh position={[0.4, 1.1, 0]} castShadow>
                    <boxGeometry args={[0.7, 0.2, 0.25]} />
                    <meshStandardMaterial color="#43834c" />
                </mesh>
            </group>
        );
    }

    if (type === "rocks") {
        return (
            <mesh position={[...position.slice(0, 1), 0.5, position[2]]} castShadow>
                <dodecahedronGeometry args={[0.8, 0]} />
                <meshStandardMaterial color="#454046" roughness={1} />
            </mesh>
        );
    }

    if (type === "crystals") {
        return (
            <mesh position={[position[0], 0.9, position[2]]} castShadow>
                <octahedronGeometry args={[0.65, 0]} />
                <meshStandardMaterial
                    color="#00e5ff"
                    emissive="#00aacc"
                    emissiveIntensity={1.5}
                    metalness={0.3}
                />
            </mesh>
        );
    }

    return null;
}

export default function EnvironmentRenderer({
    theme = "garden",
}) {
    const environment = getEnvironment(theme);

    const decorations = useMemo(() => {
        return Array.from({ length: 20 }, (_, index) => {
            const angle = (index / 20) * Math.PI * 2;
            const radius = 18 + (index % 3) * 3;

            return [
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius,
            ];
        });
    }, []);

    return (
        <>
            <color
                attach="background"
                args={[environment.background]}
            />

            <fog
                attach="fog"
                args={[
                    environment.fog,
                    environment.fogNear,
                    environment.fogFar,
                ]}
            />

            <ambientLight intensity={environment.ambient} />

            <directionalLight
                position={[10, 20, 10]}
                intensity={environment.sun}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />

            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.6, 0]}
                receiveShadow
            >
                <planeGeometry args={[150, 150]} />
                <meshStandardMaterial
                    color={environment.ground}
                    roughness={1}
                />
            </mesh>

            {decorations.map((position, index) => (
                <AnimatedDecoration
                    key={index}
                    index={index}
                    type={environment.decorations}
                    position={position}
                />
            ))}
        </>
    );
}
