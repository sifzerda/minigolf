// src/components/GolfGame.jsx

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import ShotPowerMeter from "./ShotPowerMeter";
import { courses } from "../courses";
import useGameStore from "../store/useGameStore";
import MenuScreen from "../screens/MenuScreen";
import CoursePreviewScreen from "../screens/CoursePreviewScreen";
import CourseSession from "./CourseSession";
import CourseSelectScreen from "../screens/CourseSelectScreen";
//import GameCompleteScreen from "../screens/GameCompleteScreen";
//import PauseScreen from "../screens/PauseScreen";
//import ScorecardScreen from "../screens/ScorecardScreen";
//import HowToPlayScreen from "../screens/HowToPlayScreen";
//import SettingsScreen from "../screens/SettingsScreen";
import { Stats } from "@react-three/drei";

function SpinControls() {
    const topSpin = useGameStore(
        (s) => s.topSpin
    );

    const sideSpin = useGameStore(
        (s) => s.sideSpin
    );

    const setTopSpin = useGameStore(
        (s) => s.setTopSpin
    );

    const setSideSpin = useGameStore(
        (s) => s.setSideSpin
    );

    const resetSpin = useGameStore(
        (s) => s.resetSpin
    );

    return (
        <div className="spin-controls">
            <h3>Ball Spin</h3>

            <label>
                Topspin / Backspin:
                {" "}
                {Math.round(topSpin * 100)}%
            </label>

            <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={topSpin}
                onChange={(event) =>
                    setTopSpin(Number(event.target.value))
                }
            />

            <label>
                Sidespin:
                {" "}
                {Math.round(sideSpin * 100)}%
            </label>

            <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={sideSpin}
                onChange={(event) =>
                    setSideSpin(Number(event.target.value))
                }
            />

            <button
                type="button"
                className="secondary-button"
                onClick={resetSpin}
            >
                Reset Spin
            </button>
        </div>
    );
}


export default function GolfGame() {
    const [screen, setScreen] = useState("menu");
    const [previewIndex, setPreviewIndex] = useState(0);

    const courseIndex = useGameStore((s) => s.courseIndex);
    const sessionId = useGameStore((s) => s.sessionId);

    const strokes = useGameStore((s) => s.strokes);
    const results = useGameStore((s) => s.results);
    const completed = useGameStore((s) => s.completed);
    const gameComplete = useGameStore((s) => s.gameComplete);

    const power = useGameStore((s) => s.power);
    const charging = useGameStore((s) => s.charging);
    const aimAngle = useGameStore((s) => s.aimAngle);
    const cameraMode = useGameStore((s) => s.cameraMode);

    const setPower = useGameStore((s) => s.setPower);
    const nextCourse = useGameStore((s) => s.nextCourse);
    const restartCourse = useGameStore((s) => s.restartCourse);
    const resetGame = useGameStore((s) => s.resetGame);
    const toggleCameraMode = useGameStore(
        (s) => s.toggleCameraMode
    );

    const course = courses[courseIndex];

    const totalStrokes = results.reduce(
        (sum, result) => sum + result.strokes,
        0
    );

    const totalPar = results.reduce(
        (sum, result) => sum + result.par,
        0
    );

    const difference = totalStrokes - totalPar;

    const degrees =
        ((Math.round((aimAngle * 180) / Math.PI) % 360) +
            360) %
        360;

    const isLastCourse =
        courseIndex === courses.length - 1;

    useEffect(() => {
        function handleKeyDown(event) {
            if (screen !== "play" || gameComplete) return;
            if (event.code !== "KeyV" || event.repeat) return;

            const target = event.target;
            const tag = target?.tagName;

            if (
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT" ||
                target?.isContentEditable
            ) {
                return;
            }

            event.preventDefault();
            toggleCameraMode();
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [screen, gameComplete, toggleCameraMode]);

    function handleNewGame() {
        resetGame();
        setScreen("menu");
    }

    function handleReturnToSelection() {
        setScreen("select");
    }

    if (screen === "menu") {
        return (
            <div className="game">
                <MenuScreen
                    onPlay={() => setScreen("select")}
                    onSelectCourses={() => setScreen("select")}
                />
            </div>
        );
    }

    if (screen === "select") {
        return (
            <div className="game">
                <CourseSelectScreen
                    onPreview={(index) => {
                        setPreviewIndex(index);
                        setScreen("preview");
                    }}
                    onBack={() => setScreen("menu")}
                />
            </div>
        );
    }

    if (screen === "preview") {
        return (
            <div className="game">
                <CoursePreviewScreen
                    courseIndex={previewIndex}
                    onBack={() => setScreen("select")}
                    onPlay={() => setScreen("play")}
                />
            </div>
        );
    }

    if (!course && !gameComplete) {
        return (
            <div className="game">
                <div className="hud">
                    <h2>Course not found</h2>

                    <button
                        type="button"
                        onClick={handleNewGame}
                    >
                        Select Course
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="game">
            {!gameComplete && (
                <Canvas
                    key={`${courseIndex}-${sessionId}`}
                    shadows="soft"
                    dpr={[1, 1.25]}
                    gl={{
                        antialias: false,
                        powerPreference: "high-performance",
                        alpha: false,
                        stencil: false,
                        depth: true,
                    }}
                    camera={{
                        position: [0, 5, 15],
                        fov: 55,
                        near: 0.1,
                        far: 100,
                    }}
                >
                    <CourseSession courseIndex={courseIndex} />
               
               {import.meta.env.DEV && <Stats />}
               
                </Canvas>
            )}

            {!gameComplete && (
                <div className="hud">
                    <h2>Mini Golf</h2>

                    <p>
                        Course {courseIndex + 1} / {courses.length}
                    </p>

                    <h3>{course.name}</h3>

                    <p>Par: {course.par}</p>
                    <p>Strokes: {strokes}</p>

                    {!completed ? (
                        <>
                            <p>Aim: {degrees}°</p>



                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.05"
                                value={power}
                                disabled={charging}
                                onChange={(event) =>
                                    setPower(Number(event.target.value))
                                }
                            />

                            <ShotPowerMeter />

                            <SpinControls />

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={toggleCameraMode}
                            >
                                {cameraMode === "follow"
                                    ? "Course Overview"
                                    : "Follow Ball"}
                            </button>

                            <div className="controls-help">
                                <p>Right drag: Aim</p>
                                <p>Left hold/release: Shoot</p>
                                <p>Mouse wheel: Zoom</p>
                                <p>Space: Shoot</p>
                                <p>R: Reset ball</p>
                                <p>V: Toggle camera</p>
                                <p>J: Jump shot</p>
                                <p>Shift + Left hold/release: Charged jump shot</p>
                            </div>
                        </>
                    ) : (
                        <div className="completion">
                            <h3>Course Complete!</h3>

                            <p>
                                {strokes} strokes — Par {course.par}
                            </p>

                            <button
                                type="button"
                                onClick={nextCourse}
                            >
                                {isLastCourse
                                    ? "View Scorecard"
                                    : "Next Course"}
                            </button>
                        </div>
                    )}

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={restartCourse}
                    >
                        Restart Course
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={handleReturnToSelection}
                    >
                        Course Selection
                    </button>
                </div>
            )}

            {gameComplete && (
                <div className="scorecard-screen">
                    <div className="scorecard">
                        <h1>All Courses Complete!</h1>

                        <p>
                            Completed {results.length} courses
                        </p>

                        <table>
                            <thead>
                                <tr>
                                    <th>Course</th>
                                    <th>Par</th>
                                    <th>Strokes</th>
                                    <th>+/-</th>
                                </tr>
                            </thead>

                            <tbody>
                                {results.map((result) => {
                                    const diff =
                                        result.strokes - result.par;

                                    return (
                                        <tr key={result.courseId}>
                                            <td>{result.name}</td>
                                            <td>{result.par}</td>
                                            <td>{result.strokes}</td>
                                            <td>
                                                {diff > 0 ? "+" : ""}
                                                {diff}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                            <tfoot>
                                <tr>
                                    <th>Total</th>
                                    <th>{totalPar}</th>
                                    <th>{totalStrokes}</th>
                                    <th>
                                        {difference > 0 ? "+" : ""}
                                        {difference}
                                    </th>
                                </tr>
                            </tfoot>
                        </table>

                        <button
                            type="button"
                            onClick={handleNewGame}
                        >
                            Course Selection
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
