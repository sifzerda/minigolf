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

import EnvironmentRenderer from "../renderers/EnvironmentRenderer";
import HoleFlag from "../renderers/HoleFlag";

import TerrainRenderer from "../renderers/TerrainRenderer";

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

  const theme = course.environment ?? "garden";

  return (
    <>
      {/* Environment includes lighting */}
      <EnvironmentRenderer theme={theme} />

      {/* Decorative hole flag */}
      <HoleFlag
        position={course.hole.position}
        color={FLAG_COLORS[theme] ?? FLAG_COLORS.garden}
      />

      <Physics
        gravity={[0, -9.81, 0]}
        timeStep={1 / 60}
      >
        {/* Procedural terrain */}
        {course.terrain && (
          <TerrainRenderer terrain={course.terrain} />
        )}

        {/* Existing course geometry */}
        <CourseGeometryRenderer course={course} />

        {/* Surface regions */}
        {[...surfaceQuery].map((entity) => (
          <SurfaceRenderer
            key={entity.id}
            entity={entity}
          />
        ))}

        {/* Ramps */}
        {[...rampQuery].map((entity) => (
          <RampRenderer
            key={entity.id}
            entity={entity}
          />
        ))}

        {/* Obstacles */}
        {[...obstacleQuery].map((entity) => (
          <ObstacleRenderer
            key={entity.id}
            entity={entity}
            ballRef={ballRef}
          />
        ))}

        {/* Golf ball */}
        <GolfBall
          entity={ball}
          ballRef={ballRef}
        />

        {/* Ball physics */}
        <BallPhysicsSystem
          ballRef={ballRef}
          settledRef={settledRef}
          activeSurfaceRef={activeSurfaceRef}
        />

        {/* Hole detection */}
        <HoleSensor
          hole={hole}
          ballRef={ballRef}
        />

        {/* Shot trajectory */}
        <AimGuide
          ballRef={ballRef}
          settledRef={settledRef}
        />
      </Physics>

      {/* Camera */}
      <FollowCamera
        ballRef={ballRef}
        course={course}
      />

      {/* Player controls */}
      <GolfControls
        ballRef={ballRef}
        settledRef={settledRef}
        startPosition={ball.position}
      />
    </>
  );
}
