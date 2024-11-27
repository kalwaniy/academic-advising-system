import db from '../db/db.js'; // Import the database connection

// Helper function to evaluate auto-processing rules
export const evaluateAutoProcessing = async (request) => {
  const { course_code, submitted_by } = request;

  // Fetch student's completed courses and grades
  const completedCoursesQuery = `
    SELECT sc.course_code, sc.grade
    FROM student_courses sc
    WHERE sc.student_id = ?;
  `;
  const [completedCourses] = await db.query(completedCoursesQuery, [submitted_by]);

  const completedCoursesSet = new Set(completedCourses.map(c => c.course_code));
  const gradesMap = Object.fromEntries(completedCourses.map(c => [c.course_code, c.grade]));

  // Rule 1: ISTE 470 and STAT 145
  if (course_code === 'ISTE 470' && !completedCoursesSet.has('STAT 145')) {
    return { status: 'Rejected', reason: 'STAT 145 prerequisite cannot be waived.' };
  }

  // Rule 2: GCIS 124 and GCIS 123
  if (course_code === 'GCIS 124' && !completedCoursesSet.has('GCIS 123')) {
    return { status: 'Rejected', reason: 'GCIS 124 requires GCIS 123 completion.' };
  }

  // Rule 3: ISTE 245 prerequisites
  if (course_code === 'ISTE 245') {
    const hasNSSA241 = completedCoursesSet.has('NSSA 241');
    const hasNSSA221OrGCIS123 = completedCoursesSet.has('NSSA 221') || completedCoursesSet.has('GCIS 123');
    if (!hasNSSA241 || !hasNSSA221OrGCIS123) {
      return {
        status: 'Rejected',
        reason: 'ISTE 245 requires completion of NSSA 241 and either NSSA 221 or GCIS 123.',
      };
    }
  }

  // Rule 4: NSSA 241 exemption for C- grade in GCIS 123
  if (course_code === 'NSSA 241') {
    const gcis123Grade = gradesMap['GCIS 123'];
    if (gcis123Grade && gcis123Grade < 'C-') {
      return { status: 'Approved', reason: 'NSSA 241 does not require C- in GCIS 123.' };
    }
  }

  // Default: Requires manual review
  return { status: 'Pending', reason: 'Requires manual review.' };
};
