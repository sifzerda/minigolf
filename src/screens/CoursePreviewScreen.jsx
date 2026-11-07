// src/screens/CoursePreviewScreen.jsx

import { useMemo } from "react";
import { ArrowLeft, Play, Flag } from "lucide-react";

import { courses } from "../courses";
import CourseMapRenderer from "../renderers/CourseMapRenderer";
import useGameStore from "../store/useGameStore";

export default function CoursePreviewScreen({
  courseIndex,
  onBack,
  onPlay,
}) {
  const course = courses[courseIndex];

  const bestScores = useGameStore((s) => s.bestScores);
  const selectCourse = useGameStore((s) => s.selectCourse);

  if (!course) return null;

  const best = bestScores[course.id];

  function handlePlay() {
    if (selectCourse(courseIndex)) {
      onPlay();
    }
  }

  return (
    <div className="course-preview-screen">
      <button
        type="button"
        className="secondary-button"
        onClick={onBack}
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="course-preview-content">
        <div className="course-preview-visual">
          <CourseMapRenderer course={course} />
        </div>

        <div className="course-preview-details">
          <div className="course-preview-heading">
            <Flag size={24} />
            <span>Course {courseIndex + 1}</span>
          </div>

          <h1>{course.name}</h1>

          <div className="course-preview-stats">
            <div>
              <span>Par</span>
              <strong>{course.par}</strong>
            </div>

            <div>
              <span>Best Score</span>
              <strong>
                {best === undefined
                  ? "—"
                  : best}
              </strong>
            </div>

            <div>
              <span>Obstacles</span>
              <strong>{course.obstacles.length}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePlay}
          >
            <Play size={18} />
            Play Course
          </button>
        </div>
      </div>
    </div>
  );
}
