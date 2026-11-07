// src/courses/index.js

import course01 from "./course01";
import course02 from "./course02";
import course03 from "./course03";
import course04 from "./course04";
import course05 from "./course05";

export const TOTAL_COURSES = 18;

export const courses = [
  course01,
  course02,
  course03,
  course04,
  course05,
];

export function getCourse(index) {
  return courses[index] ?? null;
}

export function getCourseCount() {
  return courses.length;
}

export function getTotalPar() {
  return courses.reduce(
    (total, course) => total + course.par,
    0
  );
}
