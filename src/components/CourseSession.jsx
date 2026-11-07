// src/components/CourseSession.jsx

import { useEffect, useState } from "react";

import { setupGame, clearGame } from "../ecs/setupGame";
import { getCourse } from "../courses";

import GolfScene from "./GolfScene";

export default function CourseSession({ courseIndex }) {
  const [loadedCourse, setLoadedCourse] = useState(null);
  const course = getCourse(courseIndex);

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

  if (!course || loadedCourse !== course) {
    return null;
  }

  return <GolfScene course={course} />;
}
