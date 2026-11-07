// src/screens/CourseSelectScreen.jsx

import { Lock, CheckCircle2, Flag } from "lucide-react";

import { courses, TOTAL_COURSES } from "../courses";
import useGameStore from "../store/useGameStore";

export default function CourseSelectScreen({ onPreview,
    onBack, }) {
    const bestScores = useGameStore((s) => s.bestScores);
    const isCourseUnlocked = useGameStore(
        (s) => s.isCourseUnlocked
    );

    const selectCourse = useGameStore(
        (s) => s.selectCourse
    );

    const slots = Array.from(
        { length: TOTAL_COURSES },
        (_, index) => {
            const course = courses[index] ?? null;
            const best = course
                ? bestScores[course.id]
                : undefined;

            const completed = best !== undefined;
            const unlocked =
                Boolean(course) && isCourseUnlocked(index);

            return {
                index,
                course,
                best,
                completed,
                unlocked,
            };
        }
    );

    const completedCount = slots.filter(
        (slot) => slot.completed
    ).length;

    function handleSelect(index) {
        onPreview(index);
    }

    return (
        <div className="course-select-screen">
            <div className="course-select-header">
                <h1>Select Course</h1>

                <p>
                    {completedCount} / {TOTAL_COURSES} completed
                </p>
            </div>

            <button
                type="button"
                className="secondary-button"
                onClick={onBack}
            >
                Back to Menu
            </button>

            <div className="course-grid">
                {slots.map((slot) => {
                    const {
                        index,
                        course,
                        best,
                        completed,
                        unlocked,
                    } = slot;

                    const status = completed
                        ? "completed"
                        : unlocked
                            ? "available"
                            : "locked";

                    return (
                        <button
                            key={index}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => handleSelect(index)}
                            className={`course-tile ${status}`}
                        >
                            <div className="course-tile-top">
                                <span className="course-number">
                                    {String(index + 1).padStart(2, "0")}
                                </span>

                                {completed ? (
                                    <CheckCircle2 size={20} />
                                ) : unlocked ? (
                                    <Flag size={20} />
                                ) : (
                                    <Lock size={18} />
                                )}
                            </div>

                            <div className="course-tile-body">
                                <h3>
                                    {course?.name ??
                                        `Course ${index + 1}`}
                                </h3>

                                <p>
                                    {course
                                        ? `Par ${course.par}`
                                        : "Coming Soon"}
                                </p>
                            </div>

                            <div className="course-tile-bottom">
                                {completed ? (
                                    <span>
                                        Best: {best} strokes
                                    </span>
                                ) : unlocked ? (
                                    <span>Play Course</span>
                                ) : (
                                    <span>
                                        {course ? "Locked" : "Coming Soon"}
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
