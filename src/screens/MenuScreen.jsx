// src/screens/MenuScreen.jsx

import { Flag, Play, Trophy, Settings } from "lucide-react";
import { TOTAL_COURSES } from "../courses";
import useGameStore from "../store/useGameStore";

export default function MenuScreen({ onPlay, onSelectCourses, onSettings }) {

  const bestScores = useGameStore((s) => s.bestScores);
  const completedCount = Object.keys(bestScores).length;

  return (
    <div className="main-menu-screen"><div className="main-menu-content">
      <Flag size={48} className="main-menu-icon" />
      <h1>Mini Golf</h1>
      <p>Complete all {TOTAL_COURSES} courses and beat your best scores.</p>
      <div className="main-menu-stats"><Trophy size={20} /><span>{completedCount} / {TOTAL_COURSES} Completed</span></div>
      <div className="main-menu-actions">
        <button type="button" onClick={onPlay}><Play size={18} />Play</button>
        <button type="button" className="secondary-button" onClick={onSelectCourses}>Select Course</button>
        <button type="button" className="secondary-button" onClick={onSettings}><Settings size={18} />Settings</button>
      </div>
    </div></div>
  );

}