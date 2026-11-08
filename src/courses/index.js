// src/courses/index.js

import course01 from "./course01";
import course02 from "./course02";
import course03 from "./course03";
import course04 from "./course04";
import course05 from "./course05";
import course06 from "./course06";
import course07 from "./course07";
import course08 from "./course08";
import course09 from "./course09";
import course10 from "./course10";
import course11 from "./course11";
import course12 from "./course12";
import course13 from "./course13";
import course14 from "./course14";
import course15 from "./course15";
import course16 from "./course16";
import course17 from "./course17";
import course18 from "./course18";

export const courses = [
  course01,
  course02,
  course03,
  course04,
  course05,
  course06,
  course07,
  course08,
  course09,
  course10,
  course11,
  course12,
  course13,
  course14,
  course15,
  course16,
  course17,
  course18,
];

export const TOTAL_COURSES = courses.length;

export function getCourse(index) {
  return courses[index] ?? null;
}

export function getCourseCount() {
  return courses.length;
}

export function getTotalPar() {
  return courses.reduce((total, course) => total + course.par, 0);
}
