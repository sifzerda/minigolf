// src/components/CourseSession.jsx

import { useEffect, useMemo, useState } from "react";
import { setupGame, clearGame } from "../ecs/setupGame";
import { getCourse } from "../courses";
import GolfScene from "./GolfScene";

export default function CourseSession({
  courseIndex,
  paused = false,
}) {
  // Only retrieve/build a course when its index changes.
  const course = useMemo(() => getCourse(courseIndex), [courseIndex]);
  // Track which course has completed ECS initialization.
  const [loadedCourse, setLoadedCourse] = useState(null);

  useEffect(() => {
    if (!course) {
      setLoadedCourse(null);
      return;
    }

    setupGame(course);
    setLoadedCourse(course);

    return () => {
      clearGame();
    };
  }, [course]);

  // Prevent rendering the scene before setupGame finishes.
  if (!course || loadedCourse !== course) {
    return null;
  }

  return (
    <GolfScene
      course={course}
      paused={paused}
    />
  );
}
