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
import LightingRenderer from "./LightingRenderer";
import EnvironmentRenderer from "../renderers/EnvironmentRenderer";

import HoleFlag from "../renderers/HoleFlag";

const FLAG_COLORS = {
  garden: "#ff4545",
  desert: "#ff9f1c",
  snow: "#0088ff",
  volcanic: "#ff5500",
  neon: "#00e5ff",
};

export default function GolfScene({ course }) {
  const ballRef = useRef(null);
  const settledRef = useRef(false);
  const activeSurfaceRef = useRef("grass");

  const ball = [...ballQuery][0];
  const hole = [...holeQuery][0];

  if (!course || !ball || !hole) return null;

  return (
    <>
      <LightingRenderer theme={theme} />

      <EnvironmentRenderer
        theme={course.environment ?? "garden"}
      />

      <HoleFlag
        position={course.hole.position}
        color={
          FLAG_COLORS[course.environment] ??
          FLAG_COLORS.garden
        }
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
            ballRef={ballRef}
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
