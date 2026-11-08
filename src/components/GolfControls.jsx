// src/components/GolfControls.jsx

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import useGameStore from "../store/useGameStore";
import { resetBall } from "../ecs/systems/ShotSystem";
import { renderActivity } from "../utils/renderActivity";

const MAX_CHARGE_TIME = 1.5;
const ROTATION_SENSITIVITY = 0.005;
const SPIN_STEP = 0.2;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

export default function GolfControls({ ballRef, settledRef, startPosition }) {
  const { gl } = useThree();
  const dragging = useRef(false);
  const charging = useRef(false);
  const chargeStart = useRef(0);
  const jumpCharge = useRef(false);

  useFrame(() => {
    if (!charging.current) return;
    renderActivity.wake(250);
    const power = clamp((performance.now() - chargeStart.current) / 1000 / MAX_CHARGE_TIME, 0.1, 1);
    const state = useGameStore.getState();
    if (Math.abs(state.power - power) >= 0.01) state.setPower(power);
  });

  useEffect(() => {
    const canvas = gl.domElement;
    const canShoot = () => {
      const s = useGameStore.getState();
      return !s.completed && !s.gameComplete && !s.shotRequest && settledRef.current && !!ballRef.current;
    };
    const startCharge = (jump) => {
      if (!canShoot() || charging.current) return;
      renderActivity.wake(2000);
      charging.current = true;
      jumpCharge.current = jump;
      chargeStart.current = performance.now();
      const s = useGameStore.getState();
      s.setChargeMode(jump ? "jump" : "normal");
      s.setPower(0.1);
      s.setCharging(true);
    };
    const releaseCharge = () => {
      if (!charging.current) return;
      renderActivity.wake(1000);
      charging.current = false;
      const s = useGameStore.getState();
      const power = clamp((performance.now() - chargeStart.current) / 1000 / MAX_CHARGE_TIME, 0.1, 1);
      s.setPower(power);
      s.setCharging(false);
      if (canShoot()) s.requestShot(power, s.aimAngle, jumpCharge.current);
      s.setChargeMode("normal");
      jumpCharge.current = false;
    };
    const onPointerDown = (e) => {
      if (e.target !== canvas) return;
      if (e.button === 2) { dragging.current = true; renderActivity.wake(500); }
      if (e.button === 0) startCharge(e.shiftKey);
    };
    const onPointerMove = (e) => {
      if (!dragging.current) return;
      renderActivity.wake(300);
      const s = useGameStore.getState();
      s.setAimAngle(s.aimAngle - e.movementX * ROTATION_SENSITIVITY);
    };
    const onPointerUp = (e) => {
      if (e.button === 2) { dragging.current = false; renderActivity.wake(300); }
      if (e.button === 0) releaseCharge();
    };
    const onWheel = (e) => {
      if (e.target !== canvas) return;
      e.preventDefault(); renderActivity.wake(500);
      const s = useGameStore.getState();
      s.setCameraDistance(s.cameraDistance + e.deltaY * 0.01);
    };
    const onKeyDown = (e) => {
      const target = e.target;
      if (target instanceof HTMLElement && (target.closest("input, textarea, select, button") || target.isContentEditable)) return;
      if (e.repeat) return;
      const s = useGameStore.getState();
      const actions = {
        KeyW: () => s.setTopSpin(s.topSpin + SPIN_STEP),
        KeyS: () => s.setTopSpin(s.topSpin - SPIN_STEP),
        KeyQ: () => s.setSideSpin(s.sideSpin - SPIN_STEP),
        KeyE: () => s.setSideSpin(s.sideSpin + SPIN_STEP),
        KeyX: () => s.resetSpin(),
        Space: () => { if (!charging.current && canShoot()) s.requestShot(s.power, s.aimAngle, false); },
        KeyJ: () => { if (!charging.current && canShoot()) s.requestShot(s.power, s.aimAngle, true); },
        KeyR: () => { s.clearShotRequest(s.shotRequest?.id); resetBall(ballRef.current, startPosition, settledRef); },
      };
      if (!actions[e.code]) return;
      if (e.code === "Space" || e.code === "KeyJ") e.preventDefault();
      renderActivity.wake(1000);
      actions[e.code]();
    };
    const onContextMenu = (e) => { if (e.target === canvas) e.preventDefault(); };
    const onBlur = () => {
      dragging.current = false; charging.current = false; jumpCharge.current = false;
      const s = useGameStore.getState(); s.setChargeMode("normal"); s.setCharging(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onBlur);
    canvas.addEventListener("contextmenu", onContextMenu);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  }, [gl, ballRef, settledRef, startPosition]);
  return null;
}
