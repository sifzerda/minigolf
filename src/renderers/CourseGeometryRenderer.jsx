// src/renderers/CourseGeometryRenderer.jsx

import { useMemo } from "react";
import { prepareTerrainFeatures, createTerrainHeightSampler } from "../terrain/Terrain";
import CourseSection from "./FloorRenderer";
import { BoundaryMesh, CourseWall } from "./BoundaryRenderer";
import GolfCup from "./GolfCupRenderer";

export default function CourseGeometryRenderer({
  course,
}) {
  const terrain = course?.terrain;

  const preparedFeatures = useMemo(
    () =>
      terrain
        ? prepareTerrainFeatures(terrain)
        : null,
    [terrain]
  );

  const heightSampler = useMemo(
    () =>
      createTerrainHeightSampler(
        terrain,
        preparedFeatures
      ),
    [terrain, preparedFeatures]
  );

  if (!course) return null;

  const sections =
    course.sections ?? [];

  const walls =
    course.walls ?? [];

  const surfaces =
    course.surfaces ?? [];

  return (
    <group>
      {sections.map((section, index) => (
        <CourseSection
          key={section.id ?? index}
          section={section}
          hole={
            section.type === "floor" &&
              section.excludeWater !== true
              ? course.hole
              : null
          }
          surfaces={surfaces}
          terrain={terrain}
          preparedFeatures={preparedFeatures}
          heightSampler={heightSampler}
        />
      ))}

      {course.boundaryRings?.length > 0 && (
        <BoundaryMesh
          rings={
            course.boundaryRings
          }
          style={
            course.wallStyle ?? {}
          }
          terrain={terrain}
          preparedFeatures={
            preparedFeatures
          }
          heightSampler={heightSampler}
        />
      )}

      {walls.map((wall, index) => (
        <CourseWall
          key={wall.id ?? index}
          wall={wall}
          terrain={terrain}
          preparedFeatures={
            preparedFeatures
          }
          heightSampler={heightSampler}
        />
      ))}

      {course.hole && (
        <GolfCup
          hole={{
            ...course.hole,
            position: [
              course.hole.position[0],
              (course.hole.position[1] ?? 0) +
              heightSampler.heightAt(
                course.hole.position[0],
                course.hole.position[2]
              ),
              course.hole.position[2],
            ],
          }}
        />
      )}

    </group>
  );
}
