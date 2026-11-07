// src/components/GolfScene.jsx

import { useRef } from "react";
import { Physics } from "@react-three/rapier";

import {
  ballQuery,
  holeQuery,
  obstacleQuery,
  rampQuery,
  surfaceQuery,
} from "../ecs/world";

import GolfBall from "../physics/GolfBall";
import HoleSensor from "../physics/HoleSensor";

import BallPhysicsSystem from "../ecs/systems/BallPhysicsSystem";

import CourseRenderer from "../renderers/CourseRenderer";
import RampRenderer from "../renderers/RampRenderer";
import SurfaceRenderer from "../renderers/SurfaceRenderer";
import ObstacleRenderer from "../renderers/ObstacleRenderer";
import FollowCamera from "../renderers/FollowCamera";
import AimGuide from "../renderers/AimGuide";

import GolfControls from "./GolfControls";

export default function GolfScene() {
  const ballRef = useRef(null);
  const settledRef = useRef(false);
  const activeSurfaceRef = useRef("grass");

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

      <Physics
        gravity={[0, -9.81, 0]}
        timeStep={1 / 60}
      >
        <CourseRenderer />

        {[...surfaceQuery].map((entity, index) => (
          <SurfaceRenderer
            key={`surface-${index}`}
            entity={entity}
          />
        ))}

        {[...rampQuery].map((entity, index) => (
          <RampRenderer
            key={`ramp-${index}`}
            entity={entity}
          />
        ))}

        {[...obstacleQuery].map((entity, index) => (
          <ObstacleRenderer
            key={`obstacle-${index}`}
            entity={entity}
          />
        ))}

        {ball && (
          <>
            <GolfBall
              entity={ball}
              ballRef={ballRef}
            />

            <BallPhysicsSystem
              ballRef={ballRef}
              settledRef={settledRef}
              activeSurfaceRef={activeSurfaceRef}
            />
          </>
        )}

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

          <AimGuide
            ballRef={ballRef}
            settledRef={settledRef}
          />

          <GolfControls
            ballRef={ballRef}
            settledRef={settledRef}
            startPosition={ball.position}
          />
        </>
      )}
    </>
  );
}
