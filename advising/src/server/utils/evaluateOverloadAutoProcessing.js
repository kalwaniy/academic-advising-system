/* eslint-disable no-unused-vars */
import db from '../db/db.js';
import logger from './logger.js';

export const evaluateOverloadAutoProcessing = async (overloadRequest) => {
  const { submitted_by, total_credits } = overloadRequest;
  logger.debug(`Evaluating overload auto-processing for student: ${submitted_by}, credits: ${total_credits}`);

  // Basic validation
  if (!submitted_by || typeof total_credits === 'undefined') {
    return { status: 'Error', reason: 'Missing student ID or total_credits.' };
  }

  // 1. Fetch student’s GPA + year from student_academic_info
  let studentInfo;
  try {
    const [rows] = await db.query(
      `SELECT CGPA, year_level
       FROM student_academic_info
       WHERE university_id = ?`,
      [submitted_by]
    );
    if (!rows.length) {
      return { status: 'Error', reason: 'Student not found in student_academic_info.' };
    }
    studentInfo = rows[0];
  } catch (error) {
    logger.error('Database query failed for student_academic_info:', error);
    return { status: 'Error', reason: 'Unable to fetch student’s academic info.' };
  }

  const { CGPA, year_level } = studentInfo;
  logger.debug(`Found CGPA: ${CGPA}, year_level: ${year_level}`);

  // 2. Check each auto-reject criterion
  // Criterion A: CGPA < 3.0
  if (CGPA < 3.0) {
    return { status: 'Rejected', reason: 'Auto-rejected: GPA below 3.0' };
  }

  // Criterion B: year_level < 2 implies first year
  if (year_level < 2) {
    return { status: 'Rejected', reason: 'Auto-rejected: First-year student' };
  }

  // Criterion C: total_credits > 22
  if (parseInt(total_credits, 10) > 22) {
    return { status: 'Rejected', reason: 'Auto-rejected: Over 22 credits requested' };
  }

  // If none of the criteria triggered a reject => let it proceed to manual review
  return { status: 'Pending', reason: 'Requires manual review.' };
};
