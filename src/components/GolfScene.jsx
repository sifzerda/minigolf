// src/components/GolfScene.jsx

import { useRef, useEffect, useMemo } from "react";
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

import { setActiveTerrain } from "../ecs/systems/SurfaceSystem";
import { renderActivity } from "../utils/renderActivity";

const GRAVITY = [0, -9.81, 0];

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

  const entities = useMemo(
    () => ({
      ball: [...ballQuery][0],
      hole: [...holeQuery][0],
      obstacles: [...obstacleQuery],
      ramps: [...rampQuery],
      surfaces: [...surfaceQuery],
    }),
    [course]
  );

  // Register the existing Rapier ball with
  // the adaptive rendering controller.
  useEffect(() => {
    renderActivity.registerBall(ballRef);
    renderActivity.wake(1000);

    return () => {
      renderActivity.unregisterBall(ballRef);
    };
  }, []);

  // Update terrain surface configuration.
  useEffect(() => {
    setActiveTerrain(course?.terrain);

    return () => {
      setActiveTerrain(null);
    };
  }, [course?.terrain]);

  if (!course || !entities.ball || !entities.hole) {
    return null;
  }

  const theme = course.environment ?? "garden";

  return (
    <>
      <EnvironmentRenderer theme={theme} />

      <HoleFlag
        position={course.hole.position}
        color={
          FLAG_COLORS[theme] ??
          FLAG_COLORS.garden
        }
      />

      <Physics
        gravity={GRAVITY}
        timeStep={1 / 60}
        updateLoop="independent"
        interpolation
        colliders={false}
      >
        {course.terrain && (
          <TerrainRenderer terrain={course.terrain} />
        )}

        <CourseGeometryRenderer course={course} />

        {entities.surfaces.map((entity) => (
          <SurfaceRenderer
            key={entity.id}
            entity={entity}
          />
        ))}

        {entities.ramps.map((entity) => (
          <RampRenderer
            key={entity.id}
            entity={entity}
          />
        ))}

        {/* Render each obstacle exactly once. */}
        {entities.obstacles.map((entity, index) => (
          <ObstacleRenderer
            key={entity.id ?? `ecs-${index}`}
            entity={entity}
            ballRef={ballRef}
          />
        ))}

        <GolfBall
          entity={entities.ball}
          ballRef={ballRef}
        />

        <BallPhysicsSystem
          ballRef={ballRef}
          settledRef={settledRef}
          activeSurfaceRef={activeSurfaceRef}
        />

        <HoleSensor
          hole={entities.hole}
          ballRef={ballRef}
        />

        <AimGuide
          ballRef={ballRef}
          settledRef={settledRef}
        />
      </Physics>

      <FollowCamera
        ballRef={ballRef}
        course={course}
      />

      <GolfControls
        ballRef={ballRef}
        settledRef={settledRef}
        startPosition={entities.ball.position}
      />
    </>
  );
}
