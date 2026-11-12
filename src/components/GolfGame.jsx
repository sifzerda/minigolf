// src/components/GolfGame.jsx

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stats } from "@react-three/drei";
import { Camera, RotateCcw, List, Pause } from "lucide-react";

import { courses } from "../courses";
import useGameStore from "../store/useGameStore";

import ShotPowerMeter from "./ShotPowerMeter";
import CourseSession from "./CourseSession";

import FrameRateLimit from "../renderers/FrameRateLimit";
import { renderActivity } from "../utils/renderActivity";
import { GamePauseProvider } from "../context/GamePauseContext";

// screens
import MenuScreen from "../screens/MenuScreen";
import CoursePreviewScreen from "../screens/CoursePreviewScreen";
import CourseSelectScreen from "../screens/CourseSelectScreen";
import CourseCompleteScreen from "../screens/CourseCompleteScreen";
import GameCompleteScreen from "../screens/GameCompleteScreen";
import SettingsScreen from "../screens/SettingsScreen";
import PauseScreen from "../screens/PauseScreen";
import AchievementsScreen from "../screens/AchievementsScreen";

const secondaryButton = "flex w-full items-center justify-center gap-2 rounded-lg border border-[#6e9d7c] bg-[#304c3d] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#40654e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#67efb4]";
const sliderClass = "my-3 block w-full cursor-pointer accent-[#a3ff12] disabled:cursor-not-allowed disabled:opacity-50";

function SpinControls() {
    const topSpin = useGameStore((s) => s.topSpin);
    const sideSpin = useGameStore((s) => s.sideSpin);
    const setTopSpin = useGameStore((s) => s.setTopSpin);
    const setSideSpin = useGameStore((s) => s.setSideSpin);
    const resetSpin = useGameStore((s) => s.resetSpin);

    return (
        <div className="mt-5 border-t border-white/20 pt-4">
            <h3 className="mb-3 text-base font-bold text-[#a3ff12]">Ball Spin</h3>

            <label htmlFor="top-spin" className="flex justify-between gap-2 text-xs text-[#c5d6cc]">
                <span>Topspin / Backspin</span>
                <span className="font-semibold text-white">{Math.round(topSpin * 100)}%</span>
            </label>

            <input
                id="top-spin"
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={topSpin}
                onChange={(event) =>
                    setTopSpin(Number(event.target.value))
                }
                className={sliderClass}
            />

            <label htmlFor="side-spin"
                className="flex justify-between gap-2 text-xs text-[#c5d6cc]">
                <span>Side Spin</span>
                <span className="font-semibold text-white">
                    {Math.round(sideSpin * 100)}%
                </span>
            </label>

            <input
                id="side-spin"
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={sideSpin}
                onChange={(event) =>
                    setSideSpin(Number(event.target.value))
                }
                className={sliderClass}
            />

            <button
                type="button"
                className={secondaryButton}
                onClick={resetSpin}
            >
                <RotateCcw size={16} />
                Reset Spin
            </button>
        </div>
    );
}

function ControlsHelp() {
    const controls = [
        ["Right drag", "Aim"],
        ["Left hold/release", "Shoot"],
        ["Mouse wheel", "Zoom"],
        ["Space", "Shoot"],
        ["R", "Reset ball"],
        ["V", "Toggle camera"],
        ["J", "Jump shot"],
        ["Shift + Left hold/release", "Charged jump shot"],
    ];

    return (
        <div className="mt-5 border-t border-white/20 pt-3">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#a3ff12]">
                Controls
            </h3>

            <div className="space-y-2">
                {controls.map(([key, action]) => (
                    <div
                        key={key}
                        className="flex items-start justify-between gap-3 text-xs"
                    >
                        <span className="text-[#c5d6cc]">
                            {key}
                        </span>

                        <span className="shrink-0 font-medium text-white">
                            {action}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function GolfGame() {
    const [screen, setScreen] = useState("menu");
    const [previewIndex, setPreviewIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const courseIndex = useGameStore((s) => s.courseIndex);
    const sessionId = useGameStore((s) => s.sessionId);
    const strokes = useGameStore((s) => s.strokes);
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
    const toggleCameraMode = useGameStore((s) => s.toggleCameraMode);

    const course = courses[courseIndex];
    const degrees = ((Math.round((aimAngle * 180) / Math.PI) % 360) + 360) % 360;

    // Completion screen transitions
    useEffect(() => {
        if (screen !== "play") return;

        if (gameComplete) {
            setScreen("gameComplete");
        } else if (completed) {
            setScreen("courseComplete");
        }
    }, [screen, completed, gameComplete]);

    // Pause on escape
    useEffect(() => {
        if (screen !== "play" || paused || completed) return;

        function handleKeyDown(event) {
            if (event.code !== "Escape" || event.repeat) return;

            event.preventDefault();
            setPaused(true);
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [screen, paused, completed]);

    // Keyboard camera toggle
    useEffect(() => {
        if (screen !== "play" || paused || completed) return;

        function handleKeyDown(event) {
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
    }, [screen, paused, completed, toggleCameraMode]);

    function handleNextCourse() {
        nextCourse();
        setScreen("play");
    }

    function handleReplayCourse() {
        restartCourse();
        setScreen("play");
    }

    function handlePlayAgain() {
        resetGame();
        setPreviewIndex(0);
        setScreen("select");
    }

    function handleCourseSelection() {
        setScreen("select");
    }

    function handleMainMenu() {
        setScreen("menu");
    }

    function handlePause() {
        setPaused(true);
    }

    function handleResume() {
        setPaused(false);
    }

    function handleRestartFromPause() {
        setPaused(false);
        restartCourse();
    }

    function handleSelectFromPause() {
        setPaused(false);
        setScreen("select");
    }

    const containerClass = "relative h-full w-full overflow-hidden bg-[#101b16]";

    // Main menu
    if (screen === "menu") {
        return (
            <div className={containerClass}>
                <MenuScreen
                    onPlay={() => setScreen("select")}
                    onSelectCourses={() => setScreen("select")}
                    onAchievements={() => setScreen("achievements")}
                    onSettings={() => setScreen("settings")}
                />
            </div>
        );
    }

    // Achievements
    if (screen === "achievements") {
        return (
            <div className={containerClass}>
                <AchievementsScreen
                    onBack={handleMainMenu}
                />
            </div>
        );
    }

    // Settings
    if (screen === "settings") {
        return (
            <div className={containerClass}>
                <SettingsScreen onBack={handleMainMenu} />
            </div>
        );
    }

    // Course selection
    if (screen === "select") {
        return (
            <div className={containerClass}>
                <CourseSelectScreen
                    onPreview={(index) => {
                        setPreviewIndex(index);
                        setScreen("preview");
                    }}
                    onBack={handleMainMenu}
                />
            </div>
        );
    }

    // Course preview
    if (screen === "preview") {
        return (
            <div className={containerClass}>
                <CoursePreviewScreen
                    courseIndex={previewIndex}
                    onBack={handleCourseSelection}
                    onPlay={() => setScreen("play")}
                />
            </div>
        );
    }

    // Course complete
    if (screen === "courseComplete") {
        return (
            <div className={containerClass}>
                <CourseCompleteScreen
                    onNext={handleNextCourse}
                    onReplay={handleReplayCourse}
                    onSelect={handleCourseSelection}
                    onMenu={handleMainMenu}
                />
            </div>
        );
    }

    // Game complete
    if (screen === "gameComplete") {
        return (
            <div className={containerClass}>
                <GameCompleteScreen
                    onPlayAgain={handlePlayAgain}
                    onReplay={handleReplayCourse}
                    onSelect={handleCourseSelection}
                    onMenu={handleMainMenu}
                />
            </div>
        );
    }

    // Invalid course
    if (!course) {
        return (
            <div className={`${containerClass} flex items-center justify-center p-6`}>
                <div className="w-full max-w-sm rounded-xl border border-[#476c51] bg-[#1d3025] p-6 text-center">
                    <h2 className="mb-5 text-xl font-bold text-white">
                        Course not found
                    </h2>

                    <button
                        type="button"
                        className={secondaryButton}
                        onClick={handleCourseSelection}
                    >
                        Course Selection
                    </button>
                </div>
            </div>
        );
    }

    // Gameplay
    return (
        <div className={containerClass}>

            {!completed && !gameComplete && (
                <Canvas
                    key={`${courseIndex}-${sessionId}`}
                    frameloop="always"
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
                    onPointerDown={() => renderActivity.wake(1000)}
                    onPointerMove={() => renderActivity.wake(250)}
                    onWheel={() => renderActivity.wake(500)}
                >
                    <GamePauseProvider paused={paused}>
                        <FrameRateLimit fps={45} idleFps={10} course={course} />
                        <CourseSession courseIndex={courseIndex} paused={paused} />
                    </GamePauseProvider>
                    {import.meta.env.DEV && <Stats />}

                </Canvas>
            )}

            {
                !completed && !gameComplete && (
                    <aside className={`absolute left-3 top-3 z-10 max-h-[calc(100%-24px)] w-[min(280px,calc(100%-24px))] overflow-y-auto rounded-xl border border-white/20 bg-black/75 p-4 text-white shadow-xl backdrop-blur-md sm:left-5 sm:top-5 sm:w-[300px] sm:p-5 ${paused ? "pointer-events-none" : ""}`}>
                        {/* Course information */}
                        <h2 className="text-xl font-bold text-[#a3ff12]">
                            Mini Golf
                        </h2>

                        <p className="mt-1 text-xs text-[#c5d6cc]">
                            Course {courseIndex + 1} / {courses.length}
                        </p>

                        <h3 className="mt-4 text-lg font-semibold">
                            {course.name}
                        </h3>

                        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-white/5 p-3 text-center">
                            <div>
                                <p className="text-xs text-[#c5d6cc]">Par</p>
                                <p className="mt-1 font-bold">{course.par}</p>
                            </div>

                            <div>
                                <p className="text-xs text-[#c5d6cc]">
                                    Strokes
                                </p>
                                <p className="mt-1 font-bold">{strokes}</p>
                            </div>

                            <div>
                                <p className="text-xs text-[#c5d6cc]">Aim</p>
                                <p className="mt-1 font-bold">{degrees}°</p>
                            </div>
                        </div>

                        {/* Power */}
                        <div className="mt-5">
                            <label
                                htmlFor="shot-power"
                                className="text-xs font-semibold text-[#c5d6cc]"
                            >
                                Shot Power
                            </label>

                            <input
                                id="shot-power"
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.05"
                                value={power}
                                disabled={charging}
                                onChange={(event) =>
                                    setPower(Number(event.target.value))
                                }
                                className={sliderClass}
                            />

                            <ShotPowerMeter />
                        </div>

                        {/* Spin */}
                        <SpinControls />

                        {/* Camera */}
                        <button
                            type="button"
                            className={`${secondaryButton} mt-4`}
                            onClick={toggleCameraMode}
                        >
                            <Camera size={16} />
                            {cameraMode === "follow"
                                ? "Course Overview"
                                : "Follow Ball"}
                        </button>

                        {/* Controls */}
                        <ControlsHelp />

                        {/* Pause */}
                        <button
                            type="button"
                            className={`${secondaryButton} mt-5`}
                            onClick={handlePause}
                        >
                            <Pause size={16} />
                            Pause / Scorecard
                        </button>

                        {/* Course selection */}
                        <button
                            type="button"
                            className={`${secondaryButton} mt-5`}
                            onClick={handleCourseSelection}
                        >
                            <List size={16} />
                            Course Selection
                        </button>

                    </aside>
                )
            }

            {
                paused && !completed && !gameComplete && (
                    <PauseScreen
                        onResume={handleResume}
                        onRestart={handleRestartFromPause}
                        onSelect={handleSelectFromPause}
                    />
                )
            }

        </div >
    );
}
