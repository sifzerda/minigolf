// src/components/GolfControls.jsx

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";

import useGameStore from "../store/useGameStore";
import { resetBall } from "../ecs/systems/ShotSystem";
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
  paused = false,
}) {
  const { gl } = useThree();

  const dragging = useRef(false);
  const charging = useRef(false);
  const chargeStart = useRef(0);
  const jumpCharge = useRef(false);

  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  function cancelInput() {
    dragging.current = false;
    charging.current = false;
    jumpCharge.current = false;
    chargeStart.current = 0;

    const state = useGameStore.getState();

    state.setChargeMode("normal");
    state.setCharging(false);
  }

  // Cancel any active input when paused.
  useEffect(() => {
    if (paused) {
      cancelInput();
    }
  }, [paused]);

  // Update charge power.
  useFrame(() => {
    if (pausedRef.current || !charging.current) {
      return;
    }

    renderActivity.wake(250);

    const power = clamp(
      (performance.now() - chargeStart.current) /
        1000 /
        MAX_CHARGE_TIME,
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

    const canShoot = () => {
      if (pausedRef.current) return false;

      const state = useGameStore.getState();

      return (
        !state.completed &&
        !state.gameComplete &&
        !state.shotRequest &&
        settledRef.current &&
        !!ballRef.current
      );
    };

    const startCharge = (jump) => {
      if (pausedRef.current) return;
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
    };

    const releaseCharge = () => {
      if (pausedRef.current) return;
      if (!charging.current) return;

      renderActivity.wake(1000);

      charging.current = false;

      const state = useGameStore.getState();

      const power = clamp(
        (performance.now() - chargeStart.current) /
          1000 /
          MAX_CHARGE_TIME,
        0.1,
        1
      );

      state.setPower(power);
      state.setCharging(false);

      if (canShoot()) {
        state.requestShot(
          power,
          state.aimAngle,
          jumpCharge.current
        );
      }

      state.setChargeMode("normal");
      jumpCharge.current = false;
    };

    const onPointerDown = (event) => {
      if (pausedRef.current) return;
      if (event.target !== canvas) return;

      if (event.button === 2) {
        dragging.current = true;
        renderActivity.wake(500);
      }

      if (event.button === 0) {
        startCharge(event.shiftKey);
      }
    };

    const onPointerMove = (event) => {
      if (pausedRef.current) return;
      if (!dragging.current) return;

      renderActivity.wake(300);

      const state = useGameStore.getState();

      state.setAimAngle(
        state.aimAngle -
          event.movementX * ROTATION_SENSITIVITY
      );
    };

    const onPointerUp = (event) => {
      if (pausedRef.current) return;

      if (event.button === 2) {
        dragging.current = false;
        renderActivity.wake(300);
      }

      if (event.button === 0) {
        releaseCharge();
      }
    };

    const onWheel = (event) => {
      if (pausedRef.current) return;
      if (event.target !== canvas) return;

      event.preventDefault();

      renderActivity.wake(500);

      const state = useGameStore.getState();

      state.setCameraDistance(
        state.cameraDistance +
          event.deltaY * 0.01
      );
    };

    const onKeyDown = (event) => {
      if (pausedRef.current) return;

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
          if (!charging.current && canShoot()) {
            state.requestShot(
              state.power,
              state.aimAngle,
              false
            );
          }
        },

        KeyJ: () => {
          if (!charging.current && canShoot()) {
            state.requestShot(
              state.power,
              state.aimAngle,
              true
            );
          }
        },

        KeyR: () => {
          state.clearShotRequest(
            state.shotRequest?.id
          );

          resetBall(
            ballRef.current,
            startPosition,
            settledRef
          );
        },
      };

      if (!actions[event.code]) return;

      if (
        event.code === "Space" ||
        event.code === "KeyJ"
      ) {
        event.preventDefault();
      }

      renderActivity.wake(1000);
      actions[event.code]();
    };

    const onContextMenu = (event) => {
      if (event.target === canvas) {
        event.preventDefault();
      }
    };

    const onBlur = () => {
      dragging.current = false;
      charging.current = false;
      jumpCharge.current = false;

      const state = useGameStore.getState();

      state.setChargeMode("normal");
      state.setCharging(false);
    };

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

    window.addEventListener("blur", onBlur);

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
  }, [
    gl,
    ballRef,
    settledRef,
    startPosition,
  ]);

  return null;
}
