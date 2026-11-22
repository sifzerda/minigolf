// src/components/GolfScene.jsx

import { useEffect, useMemo, useRef, useState } from "react";
import { Physics } from "@react-three/rapier";

import {
  ballQuery,
  holeQuery,
  obstacleQuery,
  rampQuery,
  surfaceQuery,
} from "../ecs/world";

import { setupGame, clearGame } from "../ecs/setupGame";
import { PHYSICS } from "../ecs/constants/physics";
import { getEnvironment } from "../ecs/constants/environments";

import GolfBall from "../physics/GolfBall";
import HoleSensor from "../physics/HoleSensor";
import BallPhysicsSystem from "../ecs/systems/BallPhysicsSystem";

import CourseGeometryRenderer from "../renderers/CourseGeometryRenderer";
import SurfaceRenderer from "../renderers/SurfaceRenderer";
import ObstacleRenderer from "../renderers/ObstacleRenderer";
import FollowCamera from "../renderers/FollowCamera";
import AimGuide from "../renderers/AimGuide";
import GolfClub from "../renderers/GolfClub";
import EnvironmentRenderer from "../renderers/EnvironmentRenderer";
import HoleFlag from "../renderers/HoleFlag";
import TerrainRenderer from "../renderers/TerrainRenderer";
import GolfControls from "./GolfControls";
import { renderActivity } from "../utils/renderActivity";

const GRAVITY = [0, PHYSICS.gravity, 0];
const EMPTY_SECTIONS = [];

function CourseContent({ course, paused }) {
  const ballRef = useRef(null);
  const settledRef = useRef(false);

  // ECS is initialized before this component mounts.
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

  useEffect(() => {
    renderActivity.registerBall(ballRef);
    renderActivity.wake(1000);

    return () => {
      renderActivity.unregisterBall(ballRef);
    };
  }, []);

  const { ball, hole, obstacles, ramps, surfaces } = entities;

  if (!ball || !hole) return null;

  const theme = course.environment ?? "garden";
  const sections = course.sections ?? EMPTY_SECTIONS;

  return (
    <>
      <EnvironmentRenderer theme={theme} />

      <HoleFlag
        position={hole.position}
        color={getEnvironment(theme).flagColor ?? "#ff4545"}
      />

      <Physics
        gravity={GRAVITY}
        timeStep={1 / 60}
        updateLoop="independent"
        interpolation
        colliders={false}
        paused={paused}
      >
        {course.terrain && (
          <TerrainRenderer
            terrain={course.terrain}
            sections={sections}
          />
        )}

        <CourseGeometryRenderer course={course} />

        {surfaces.map((entity) => (
          <SurfaceRenderer
            key={entity.id}
            entity={entity}
            sections={sections}
          />
        ))}

        {obstacles.map((entity) => (
          <ObstacleRenderer
            key={entity.id}
            entity={entity}
            ballRef={ballRef}
            paused={paused}
          />
        ))}

        <GolfBall
          entity={ball}
          ballRef={ballRef}
        />

        <BallPhysicsSystem
          ballRef={ballRef}
          settledRef={settledRef}
          terrain={course.terrain}
        />

        <HoleSensor
          hole={hole}
          ballRef={ballRef}
        />

        <AimGuide
          ballRef={ballRef}
          settledRef={settledRef}
        />

        <GolfClub
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
        startPosition={ball.position}
        paused={paused}
      />
    </>
  );
}

export default function GolfScene({ course, paused = false }) {
  const [loadedCourse, setLoadedCourse] = useState(null);

  useEffect(() => {
    if (!course) return;

    setupGame(course);
    setLoadedCourse(course);

    return () => {
      clearGame();
    };
  }, [course]);

  if (!course || loadedCourse !== course) {
    return null;
  }

  return <CourseContent course={course} paused={paused} />;
}
