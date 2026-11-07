// src/ecs/world.js

import { World } from "miniplex";

export const world = new World();

export const ballQuery = world.with("ball");
export const holeQuery = world.with("hole");
export const obstacleQuery = world.with("obstacle");

export const rampQuery = world.with("ramp");
export const surfaceQuery = world.with("surface");
