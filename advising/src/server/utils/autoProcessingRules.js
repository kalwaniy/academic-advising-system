/* eslint-disable no-unused-vars */
import db from '../db/db.js'; // Import the database connection
import logger, { logWithRequestContext } from '../utils/logger.js';

// Helper function to map grades to numeric values
const gradeValues = {
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'F': 0.0,
  'P': 0.0, // Pass, might need to define how to handle
  // Include other possible grades
};

// Helper function to evaluate auto-processing rules
export const evaluateAutoProcessing = async (request) => {
  const { course_code, submitted_by } = request;
  logger.debug(`Evaluating auto-processing for course_code: ${course_code}, submitted_by: ${submitted_by}`);

  // Input validation
  if (!course_code || !submitted_by) {
    return { status: 'Error', reason: 'Missing course code or student ID.' };
  }

  // Fetch student's completed courses and grades
  const completedCoursesQuery = `
    SELECT sc.course_code, sc.grade
    FROM student_courses sc
    WHERE sc.student_id = ?;
  `;

  let completedCourses;
  try {
    const [courses] = await db.query(completedCoursesQuery, [submitted_by]);
    completedCourses = courses || [];
    logger.debug(`Completed courses for student ${submitted_by}: ${JSON.stringify(completedCourses)}`);
  } catch (error) {
    logger.error('Database query failed:', error);
    return { status: 'Error', reason: 'Unable to fetch completed courses.' };
  }

  const completedCoursesSet = new Set(completedCourses.map(c => c.course_code));
  const gradesMap = {};
  completedCourses.forEach(c => {
    gradesMap[c.course_code.trim().toUpperCase()] = c.grade.trim().toUpperCase();
  });
  logger.debug(`Completed courses set: ${Array.from(completedCoursesSet).join(', ')}`);
  logger.debug(`Grades map: ${JSON.stringify(gradesMap)}`);

  // Rule 1: ISTE 470 and STAT 145
  if (course_code === 'ISTE 470' && !completedCoursesSet.has('STAT 145')) {
    return { status: 'Rejected', reason: 'STAT 145 prerequisite cannot be waived.' };
  }

  // Rule 2: GCIS 124 and GCIS 123
  if (course_code === 'GCIS124' && !completedCoursesSet.has('GCIS123')) {
    return { status: 'Rejected', reason: 'GCIS 124 requires GCIS 123 completion.' };
  }

  // Rule 3: ISTE 245 prerequisites
  if (course_code === 'ISTE245') {
    const hasNSSA241 = completedCoursesSet.has('NSSA241');
    const hasNSSA221OrGCIS123 = completedCoursesSet.has('NSSA 221') || completedCoursesSet.has('GCIS 123');
    if (!hasNSSA241 || !hasNSSA221OrGCIS123) {
      return {
        status: 'Rejected',
        reason: 'ISTE 245 requires completion of NSSA 241 and either NSSA 221 or GCIS 123.',
      };
    }
  }

  // Rule 4: NSSA 241 exemption for C- grade in GCIS 123
  if (course_code === 'NSSA241') {
    const gcis123Grade = gradesMap['GCIS123'];
    if (gcis123Grade && gradeValues[gcis123Grade] < gradeValues['C-']) {
      return { status: 'Approved', reason: 'NSSA 241 does not require C- in GCIS 123.' };
    }
  }

  // Default: Requires manual review
  return { status: 'Pending', reason: 'Requires manual review.' };
};
