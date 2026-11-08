// src/courses/course06.js

import {
    createPolygonFloor,
    createPolygonWalls,
} from "./courseBuilder";

const points = [
    [-4, 10],
    [2, 10],
    [2, 4],
    [4, 4],
    [4, -3],
    [1, -3],
    [1, -10],
    [-4, -10],
    [-4, -5],
    [-1, -5],
    [-1, 2],
    [-4, 2],
];

const course06 = {
    id: "course-06",
    number: 6,
    name: "Windmill",
    environment: "garden",
    par: 4,

    ballStart: [0, 0.25, 8],

    hole: {
        position: [0, 0, -8],
        radius: 0.43,
    },

    sections: [
        createPolygonFloor({
            id: "main-floor",
            points,
            color: "#328b50",
        }),
    ],

    walls: createPolygonWalls({ points }),

    surfaces: [],
    ramps: [],

    obstacles: [
        // turnstile near the starting section.

        {
            type: "windmill",
            position: [0, 0, 6],

            towerWidth: 2.2,
            towerHeight: 4.8,
            towerDepth: 1.4,

            openingWidth: 0.9,
            openingHeight: 0.85,

            bladeLength: 2.7,
            bladeWidth: 0.22,
            bladeDepth: 0.12,
            bladeCount: 4,

            axleHeight: 3.5,
            phase: Math.PI / 4,
            speed: 1,
            direction: 1,

            towerColor: "#b6a18c",
            roofColor: "#704c3b",
            color: "#e8e1d5",
            hubColor: "#555555",
        },




    ],
};

export default course06;

