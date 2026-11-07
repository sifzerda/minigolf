// src/components/GolfControls.jsx

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import useGameStore from "../store/useGameStore";
import { shootBall, resetBall } from "../ecs/systems/ShotSystem";

const MAX_CHARGE_TIME = 1.5;
const ROTATION_SENSITIVITY = 0.005;

export default function GolfControls({
  ballRef,
  settledRef,
  startPosition,
}) {
  const { gl } = useThree();

  const dragging = useRef(false);
  const charging = useRef(false);
  const chargeStart = useRef(0);

  useFrame(() => {
    if (!charging.current) return;

    const elapsed = (performance.now() - chargeStart.current) / 1000;
    const power = Math.min(1, Math.max(0.1, elapsed / MAX_CHARGE_TIME));
    useGameStore.getState().setPower(power);
  });

  useEffect(() => {
    const canvas = gl.domElement;

    function onPointerDown(event) {
      if (event.target !== canvas) return;

      if (event.button === 2) {
        dragging.current = true;
      }

      if (event.button === 0) {
        if (useGameStore.getState().completed) return;

        charging.current = true;
        chargeStart.current = performance.now();

        useGameStore.getState().setPower(0.1);
        useGameStore.getState().setCharging(true);
      }
    }

    function onPointerMove(event) {
      if (!dragging.current) return;

      const state = useGameStore.getState();
      state.setAimAngle(state.aimAngle - event.movementX * ROTATION_SENSITIVITY);
    }

    function onPointerUp(event) {
      if (event.button === 2) {
        dragging.current = false;
      }

      if (event.button === 0 && charging.current) {
        charging.current = false;

        const state = useGameStore.getState();
        state.setCharging(false);

        shootBall(ballRef.current, state.power, state.aimAngle, settledRef);
      }
    }

    function onWheel(event) {
      if (event.target !== canvas) return;
      event.preventDefault();

      const state = useGameStore.getState();
      state.setCameraDistance(state.cameraDistance + event.deltaY * 0.01);
    }

    function onKeyDown(event) {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, button")) {
        return;
      }

      if (event.repeat) return;

      const state = useGameStore.getState();

      if (event.code === "Space") {
        event.preventDefault();

        if (charging.current) return;
        shootBall(ballRef.current, state.power, state.aimAngle, settledRef);
      }

      if (event.code === "KeyR") {
        resetBall(ballRef.current, startPosition, settledRef);
      }
    }

    function onContextMenu(event) {
      if (event.target === canvas) {
        event.preventDefault();
      }
    }

    function onBlur() {
      dragging.current = false;
      charging.current = false;
      useGameStore.getState().setCharging(false);
    }

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
  }, [gl, ballRef, settledRef,startPosition]);

  return null;
}

