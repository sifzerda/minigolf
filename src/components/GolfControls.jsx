// src/components/GolfControls.jsx

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import useGameStore from "../store/useGameStore";

import {
  shootBall,
  resetBall,
} from "../ecs/systems/ShotSystem";

import { renderActivity } from "../utils/renderActivity";

const MAX_CHARGE_TIME = 1.5;
const ROTATION_SENSITIVITY = 0.005;
const SPIN_STEP = 0.2;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value));

export default function GolfControls({
  ballRef,
  settledRef,
  startPosition,
}) {
  const { gl } = useThree();

  const dragging = useRef(false);
  const charging = useRef(false);
  const chargeStart = useRef(0);
  const jumpCharge = useRef(false);

  // Update shot power while charging.
  useFrame(() => {
    if (!charging.current) return;

    renderActivity.wake(250);

    const elapsed =
      (performance.now() - chargeStart.current) /
      1000;

    const power = clamp(
      elapsed / MAX_CHARGE_TIME,
      0.1,
      1
    );

    const state = useGameStore.getState();

    if (Math.abs(state.power - power) >= 0.01) {
      state.setPower(power);
    }
  });

  useEffect(() => {
    const canvas = gl.domElement;

    function canShoot() {
      const state = useGameStore.getState();

      return (
        !state.completed &&
        !state.gameComplete &&
        settledRef.current &&
        Boolean(ballRef.current)
      );
    }

    function startCharge(jump) {
      if (!canShoot() || charging.current) return;

      renderActivity.wake(2000);

      charging.current = true;
      jumpCharge.current = jump;
      chargeStart.current = performance.now();

      const state = useGameStore.getState();

      state.setChargeMode(
        jump ? "jump" : "normal"
      );

      state.setPower(0.1);
      state.setCharging(true);
    }

    function releaseCharge() {
      if (!charging.current) return;

      renderActivity.wake(1000);

      charging.current = false;

      const state = useGameStore.getState();

      const elapsed =
        (performance.now() - chargeStart.current) /
        1000;

      const power = clamp(
        elapsed / MAX_CHARGE_TIME,
        0.1,
        1
      );

      state.setPower(power);
      state.setCharging(false);

      shootBall(
        ballRef.current,
        power,
        state.aimAngle,
        settledRef,
        jumpCharge.current
      );

      state.setChargeMode("normal");
      jumpCharge.current = false;
    }

    function onPointerDown(event) {
      if (event.target !== canvas) return;

      if (event.button === 2) {
        renderActivity.wake(500);
        dragging.current = true;
        return;
      }

      if (event.button === 0) {
        startCharge(event.shiftKey);
      }
    }

    function onPointerMove(event) {
      if (!dragging.current) return;

      renderActivity.wake(300);

      const state = useGameStore.getState();

      state.setAimAngle(
        state.aimAngle -
          event.movementX * ROTATION_SENSITIVITY
      );
    }

    function onPointerUp(event) {
      if (event.button === 2) {
        dragging.current = false;
        renderActivity.wake(300);
      }

      if (event.button === 0) {
        releaseCharge();
      }
    }

    function onWheel(event) {
      if (event.target !== canvas) return;

      event.preventDefault();

      renderActivity.wake(500);

      const state = useGameStore.getState();

      state.setCameraDistance(
        state.cameraDistance +
          event.deltaY * 0.01
      );
    }

    function onKeyDown(event) {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (
          target.closest(
            "input, textarea, select, button"
          ) ||
          target.isContentEditable
        )
      ) {
        return;
      }

      if (event.repeat) return;

      const state = useGameStore.getState();

      // Keyboard action registry.
      const actions = {
        KeyW: () =>
          state.setTopSpin(
            state.topSpin + SPIN_STEP
          ),

        KeyS: () =>
          state.setTopSpin(
            state.topSpin - SPIN_STEP
          ),

        KeyQ: () =>
          state.setSideSpin(
            state.sideSpin - SPIN_STEP
          ),

        KeyE: () =>
          state.setSideSpin(
            state.sideSpin + SPIN_STEP
          ),

        KeyX: () => state.resetSpin(),

        Space: () => {
          if (charging.current) return;

          shootBall(
            ballRef.current,
            state.power,
            state.aimAngle,
            settledRef,
            false
          );
        },

        KeyJ: () => {
          if (charging.current) return;

          shootBall(
            ballRef.current,
            state.power,
            state.aimAngle,
            settledRef,
            true
          );
        },

        KeyR: () =>
          resetBall(
            ballRef.current,
            startPosition,
            settledRef
          ),
      };

      const action = actions[event.code];

      if (!action) return;

      if (
        event.code === "Space" ||
        event.code === "KeyJ"
      ) {
        event.preventDefault();
      }

      renderActivity.wake(1000);

      action();
    }

    function onContextMenu(event) {
      if (event.target === canvas) {
        event.preventDefault();
      }
    }

    function onBlur() {
      dragging.current = false;
      charging.current = false;
      jumpCharge.current = false;

      const state = useGameStore.getState();

      state.setChargeMode("normal");
      state.setCharging(false);
    }

    window.addEventListener(
      "pointerdown",
      onPointerDown
    );

    window.addEventListener(
      "pointermove",
      onPointerMove
    );

    window.addEventListener(
      "pointerup",
      onPointerUp
    );

    window.addEventListener(
      "wheel",
      onWheel,
      { passive: false }
    );

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    window.addEventListener(
      "blur",
      onBlur
    );

    canvas.addEventListener(
      "contextmenu",
      onContextMenu
    );

    return () => {
      window.removeEventListener(
        "pointerdown",
        onPointerDown
      );

      window.removeEventListener(
        "pointermove",
        onPointerMove
      );

      window.removeEventListener(
        "pointerup",
        onPointerUp
      );

      window.removeEventListener(
        "wheel",
        onWheel
      );

      window.removeEventListener(
        "keydown",
        onKeyDown
      );

      window.removeEventListener(
        "blur",
        onBlur
      );

      canvas.removeEventListener(
        "contextmenu",
        onContextMenu
      );
    };
  }, [gl, ballRef, settledRef, startPosition]);

  return null;
}
