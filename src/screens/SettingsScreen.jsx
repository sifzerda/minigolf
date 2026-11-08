// src/screens/SettingsScreen.jsx

import { CLUB_COLORS } from "../store/useGameStore";
import useGameStore from "../store/useGameStore";

export default function SettingsScreen({ onBack }) {
  const clubColor = useGameStore((s) => s.clubColor);
  const setClubColor = useGameStore((s) => s.setClubColor);

  return (
    
    <div className="main-menu-screen">
      <div className="main-menu-content">
        <h1>Settings</h1>
        <h2>Golf Club Colour</h2>
        <div role="radiogroup" aria-label="Golf club colour" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, margin: "24px 0" }}>
          {Object.entries(CLUB_COLORS).map(([name, color]) => (
            <button key={name} type="button" role="radio" aria-checked={clubColor === name}
              aria-label={name} onClick={() => setClubColor(name)}
              style={{ width: 60, height: 70, background: color, border: clubColor === name ? "4px solid white" : "2px solid #777", borderRadius: 12, cursor: "pointer", color: name === "yellow" ? "#111" : "white", textTransform: "capitalize", fontWeight: 700 }}>
              {name}{clubColor === name ? " ✓" : ""}
            </button>
          ))}
        </div>
        <button type="button" className="secondary-button" onClick={onBack}>Back to Menu</button>
      </div>
    </div>

  );
}
