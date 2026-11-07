// src/components/GolfScene.jsx

import { useRef } from "react";
import { Physics } from "@react-three/rapier";

import {
  ballQuery,
  holeQuery,
  obstacleQuery,
} from "../ecs/world";

import GolfBall from "../physics/GolfBall";
import HoleSensor from "../physics/HoleSensor";

import CourseRenderer from "../renderers/CourseRenderer";
import ObstacleRenderer from "../renderers/ObstacleRenderer";
import FollowCamera from "../renderers/FollowCamera";
import AimGuide from "../renderers/AimGuide";

import GolfControls from "./GolfControls";

export default function GolfScene() {
  const ballRef = useRef(null);

  const ball = [...ballQuery][0];
  const hole = [...holeQuery][0];

  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight
        position={[5, 12, 5]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <Physics gravity={[0, -9.81, 0]}>
        <CourseRenderer />

        {ball && (
          <GolfBall
            entity={ball}
            ballRef={ballRef}
          />
        )}

        {[...obstacleQuery].map((entity, index) => (
          <ObstacleRenderer
            key={index}
            entity={entity}
          />
        ))}

        {ball && hole && (
          <HoleSensor
            hole={hole}
            ballRef={ballRef}
          />
        )}
      </Physics>

      {ball && (
        <>
          <FollowCamera ballRef={ballRef} />

          <AimGuide ballRef={ballRef} />

          <GolfControls
            ballRef={ballRef}
            startPosition={ball.position}
          />
        </>
      )}
    </>
  );
}
