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

import CourseGeometryRenderer from "../renderers/CourseGeometryRenderer";
import RampRenderer from "../renderers/RampRenderer";
import SurfaceRenderer from "../renderers/SurfaceRenderer";
import ObstacleRenderer from "../renderers/ObstacleRenderer";
import FollowCamera from "../renderers/FollowCamera";
import AimGuide from "../renderers/AimGuide";

import GolfControls from "./GolfControls";

export default function GolfScene({ course }) {
  const ballRef = useRef(null);
  const settledRef = useRef(false);
  const activeSurfaceRef = useRef("grass");

  const ball = [...ballQuery][0];
  const hole = [...holeQuery][0];

  if (!course || !ball || !hole) return null;

  return (
    <>
      <ambientLight intensity={0.8} />

      <directionalLight
        position={[5, 12, 5]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
        <CourseGeometryRenderer course={course} />

        {[...surfaceQuery].map((entity) => (
          <SurfaceRenderer
            key={entity.id}
            entity={entity}
          />
        ))}

        {[...rampQuery].map((entity) => (
          <RampRenderer
            key={entity.id}
            entity={entity}
          />
        ))}

        {[...obstacleQuery].map((entity) => (
          <ObstacleRenderer
            key={entity.id}
            entity={entity}
          />
        ))}

        <GolfBall
          entity={ball}
          ballRef={ballRef}
        />

        <BallPhysicsSystem
          ballRef={ballRef}
          settledRef={settledRef}
          activeSurfaceRef={activeSurfaceRef}
        />

        <HoleSensor
          hole={hole}
          ballRef={ballRef}
        />

      <AimGuide
        ballRef={ballRef}
        settledRef={settledRef}
      />

      </Physics>

      <FollowCamera ballRef={ballRef} course={course} />

      <GolfControls
        ballRef={ballRef}
        settledRef={settledRef}
        startPosition={ball.position}
      />
    </>
  );
}
