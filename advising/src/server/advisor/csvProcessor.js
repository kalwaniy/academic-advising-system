/* eslint-disable no-unused-vars */
// csvProcessor.js

import fs from 'fs';
import csv from 'csv-parser';
import db from '../db/db.js'; // Adjust path if needed
import logger, { logWithRequestContext } from '../utils/logger.js';

// Helper function to generate a unique university_id for advisors/faculty
async function generateUniqueID() {
  let unique = false;
  let id;

  while (!unique) {
    id = String(Math.floor(100000000 + Math.random() * 900000000));
    const [rows] = await db.query(
      'SELECT university_id FROM academic_advisors WHERE university_id = ?',
      [id]
    );
    if (rows.length === 0) {
      unique = true;
    }
  }
  return id;
}

/**
 * Ensure a user entry exists for the given university_id.
 * If not, create it. This satisfies the foreign key constraint on `students`.
 */
async function ensureUserExists(university_id) {
  const [userRows] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [university_id]);
  if (userRows.length === 0) {
    // Insert a default user for this student
    await db.query(
      'INSERT INTO users (user_id, username, passwd, role) VALUES (?, ?, ?, ?)',
      [university_id, `${university_id}@rit.edu`, 'password123', 'student']
    );
  }
}

// Function to process the first CSV file (Student Demographics and Academic Info)
export async function processStudentInfoCSV(filePath, req) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    const parser = csv({ separator: ',', mapHeaders: ({ header }) => header.trim() });
    const csvData = [];
    let rowCount = 0;
    let successCount = 0;
    let failureCount = 0;

    stream
      .pipe(parser)
      .on('data', (row) => {
        csvData.push(row);
      })
      .on('end', async () => {
        logger.info(`Starting processing of Student Info CSV with ${csvData.length} rows.`);
        try {
          for (const row of csvData) {
            rowCount++;
            try {
              // Extract and validate required fields
              const university_id = row['ID'] ? row['ID'].trim() : null;
              if (!university_id || !/^\d{9}$/.test(university_id)) {
                throw new Error(`Invalid university_id at row ${rowCount}: ${university_id}`);
              }

              const last_name = row['Last Name'] ? row['Last Name'].trim() : '';
              const first_name = row['First Name'] ? row['First Name'].trim() : '';
              const email_id = row['Email'] ? row['Email'].trim() : '';

              if (!first_name || !last_name) {
                throw new Error(`Missing first name or last name at row ${rowCount}`);
              }

              // Academic info fields
              const program = row['Acad Prog'] ? row['Acad Prog'].trim() : 'CIT';
              const current_semester_year = row['Current Term Enroll'] ? row['Current Term Enroll'].trim() : null;
              const year_enrolled = row['First Term Enroll'] ? row['First Term Enroll'].trim() : null;
              const year_level = row['Year Level'] ? parseInt(row['Year Level'].trim(), 10) : null;
              const CGPA = row['GPA'] ? parseFloat(row['GPA'].trim()) : null;

              const primary_advisor_name = row['Primary Advisor'] ? row['Primary Advisor'].trim() : '';
              const faculty_advisor_name = row['Faculty Advisor'] ? row['Faculty Advisor'].trim() : '';

              // Ensure the user exists
              await ensureUserExists(university_id);

              // Insert or update 'students' table
              try {
                await db.query(
                  'REPLACE INTO students (university_id, first_name, last_name, email_id) VALUES (?, ?, ?, ?)',
                  [university_id, first_name, last_name, email_id]
                );
              } catch (dbError) {
                logger.error(`Database error inserting student at row ${rowCount}: ${dbError.message}`, {
                  rowNumber: rowCount,
                  rowData: row,
                  error: dbError,
                });
                failureCount++;
                continue;
              }

              // Insert or update 'student_academic_info'
              try {
                await db.query(
                  `REPLACE INTO student_academic_info 
                    (university_id, program, year_enrolled, current_semester_year, year_level, CGPA)
                    VALUES (?, ?, ?, ?, ?, ?)
                  `,
                  [
                    university_id,
                    program,
                    year_enrolled,
                    current_semester_year,
                    year_level,
                    CGPA
                  ]
                );
              } catch (dbError) {
                logger.error(`Database error inserting academic info at row ${rowCount}: ${dbError.message}`, {
                  rowNumber: rowCount,
                  rowData: row,
                  error: dbError,
                });
                failureCount++;
                continue;
              }

              // Handle Primary Advisor from CSV (stored as 'CSV' relationship)
              if (primary_advisor_name) {
                try {
                  const advisorNameParts = primary_advisor_name.split(' ');
                  const advisor_first_name = advisorNameParts[0];
                  const advisor_last_name = advisorNameParts.slice(1).join(' ');

                  const [advisorRows] = await db.query(
                    'SELECT university_id FROM academic_advisors WHERE first_name = ? AND last_name = ?',
                    [advisor_first_name, advisor_last_name]
                  );

                  let advisor_id;
                  if (advisorRows.length > 0) {
                    advisor_id = advisorRows[0].university_id;
                  } else {
                    advisor_id = await generateUniqueID();
                    await db.query(
                      'INSERT INTO academic_advisors (university_id, first_name, last_name, email_id, department) VALUES (?, ?, ?, ?, ?)',
                      [advisor_id, advisor_first_name, advisor_last_name, '', 'CIT']
                    );
                  }

                  // Use 'CSV' as relationship_type
                  await db.query(
                    'REPLACE INTO advisor_student_relation (student_id, advisor_id, relationship_type) VALUES (?, ?, ?)',
                    [university_id, advisor_id, 'CSV']
                  );
                } catch (advisorError) {
                  logger.warn(`Error processing primary advisor at row ${rowCount}: ${advisorError.message}`, {
                    rowNumber: rowCount,
                    rowData: row,
                    error: advisorError,
                  });
                  // Continue
                }
              }

              // Handle Faculty Advisor from CSV (stored as 'CSV' relationship)
              if (faculty_advisor_name) {
                try {
                  const facultyNameParts = faculty_advisor_name.split(' ');
                  const faculty_first_name = facultyNameParts[0];
                  const faculty_last_name = facultyNameParts.slice(1).join(' ');

                  const [facultyRows] = await db.query(
                    'SELECT university_id FROM faculty WHERE first_name = ? AND last_name = ?',
                    [faculty_first_name, faculty_last_name]
                  );

                  let faculty_id;
                  if (facultyRows.length > 0) {
                    faculty_id = facultyRows[0].university_id;
                  } else {
                    faculty_id = await generateUniqueID();
                    await db.query(
                      'INSERT INTO faculty (university_id, first_name, last_name, email_id, department) VALUES (?, ?, ?, ?, ?)',
                      [faculty_id, faculty_first_name, faculty_last_name, '', 'CIT']
                    );
                  }

                  // Use 'CSV' as relationship_type
                  await db.query(
                    'REPLACE INTO advisor_student_relation (student_id, advisor_id, relationship_type) VALUES (?, ?, ?)',
                    [university_id, faculty_id, 'CSV']
                  );
                } catch (facultyError) {
                  logger.warn(`Error processing faculty advisor at row ${rowCount}: ${facultyError.message}`, {
                    rowNumber: rowCount,
                    rowData: row,
                    error: facultyError,
                  });
                  // Continue
                }
              }

              // Finally, link the uploading advisor as the primary 'Academic' advisor
              const currentAdvisorId = req.user_id; // The logged-in advisor's university_id
              try {
                await db.query(
                  'REPLACE INTO advisor_student_relation (student_id, advisor_id, relationship_type) VALUES (?, ?, ?)',
                  [university_id, currentAdvisorId, 'Academic']
                );
              } catch (relationError) {
                logger.warn(`Error linking student to current (uploading) advisor at row ${rowCount}: ${relationError.message}`, {
                  rowNumber: rowCount,
                  rowData: row,
                  error: relationError,
                });
              }

              successCount++;
              logger.debug(`Successfully processed row ${rowCount}.`);
            } catch (err) {
              failureCount++;
              logger.warn(`Error processing row ${rowCount}: ${err.message}`, {
                rowNumber: rowCount,
                rowData: row,
                error: err,
              });
              continue; // Skip to next row
            }
          }
          logger.info(`Finished processing Student Info CSV. Total rows: ${rowCount}, Successes: ${successCount}, Failures: ${failureCount}`);
          resolve();
        } catch (err) {
          logger.error(`Error processing Student Info CSV: ${err.message}`, { error: err });
          reject(err);
        }
      })
      .on('error', (err) => {
        logger.error(`Error reading Student Info CSV: ${err.message}`, { error: err });
        reject(err);
      });
  });
}

// Function to process the second CSV file (Student Course Grades)
export async function processStudentCoursesCSV(filePath, req) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    const parser = csv({ separator: ',', mapHeaders: ({ header }) => header.trim() });
    const csvData = [];
    let rowCount = 0;
    let successCount = 0;
    let failureCount = 0;

    const nonCourseColumns = [
      'Entry Term', 'TermID', 'PreU Courses', 'year level',
      'student id', 'LastName', 'First Name', 'Middle Name', 'ITS Username'
    ];

    stream
      .pipe(parser)
      .on('data', (row) => {
        csvData.push(row);
      })
      .on('end', async () => {
        logger.info(`Starting processing of Student Courses CSV with ${csvData.length} rows.`);
        try {
          for (const row of csvData) {
            rowCount++;
            try {
              // Extract and validate student_id
              const student_id = row['student id'] ? row['student id'].trim() : null;
              if (!student_id || !/^\d{9}$/.test(student_id)) {
                throw new Error(`Invalid student_id at row ${rowCount}: ${student_id}`);
              }

              // Ensure student exists
              const [studentRows] = await db.query(
                'SELECT university_id FROM students WHERE university_id = ?',
                [student_id]
              );
              if (studentRows.length === 0) {
                throw new Error(`Student not found at row ${rowCount}: ${student_id}`);
              }

              // Get term information if available
              const term_taken = row['TermID'] ? row['TermID'].trim() : 'Unknown';

              // Loop through course grades
              for (const [key, value] of Object.entries(row)) {
                // Skip non-course columns
                if (nonCourseColumns.includes(key)) continue;

                const course_code = key.trim();
                const grade = value ? value.trim() : null;

                if (grade && grade !== '--') {
                  // Validate course_code and grade
                  if (!course_code) {
                    logger.warn(`Missing course code at row ${rowCount}.`);
                    continue;
                  }
                  if (!grade) {
                    logger.warn(`Missing grade for course ${course_code} at row ${rowCount}.`);
                    continue;
                  }

                  // Ensure course exists
                  try {
                    const [courseRows] = await db.query(
                      'SELECT course_code FROM courses WHERE course_code = ?',
                      [course_code]
                    );
                    if (courseRows.length === 0) {
                      // Insert new course with minimal info
                      await db.query(
                        'INSERT INTO courses (course_code, course_title, department) VALUES (?, ?, ?)',
                        [course_code, course_code, 'CIT']
                      );
                    }
                  } catch (dbError) {
                    logger.error(`Database error when inserting course at row ${rowCount}: ${dbError.message}`, {
                      rowNumber: rowCount,
                      courseCode: course_code,
                      error: dbError,
                    });
                    continue; // Skip to next course
                  }

                  // Insert or update 'student_courses' table
                  try {
                    await db.query(
                      'REPLACE INTO student_courses (student_id, course_code, term_taken, grade) VALUES (?, ?, ?, ?)',
                      [student_id, course_code, term_taken, grade]
                    );
                  } catch (dbError) {
                    logger.error(`Database error when inserting student course at row ${rowCount}: ${dbError.message}`, {
                      rowNumber: rowCount,
                      studentId: student_id,
                      courseCode: course_code,
                      error: dbError,
                    });
                    continue; // Skip to next course
                  }
                }
              }

              successCount++;
              logger.debug(`Successfully processed row ${rowCount}.`);
            } catch (err) {
              failureCount++;
              logger.warn(`Error processing row ${rowCount}: ${err.message}`, {
                rowNumber: rowCount,
                rowData: row,
                error: err,
              });
              continue; // Skip to next row
            }
          }
          logger.info(
            `Finished processing Student Courses CSV. Total rows: ${rowCount}, Successes: ${successCount}, Failures: ${failureCount}`
          );
          resolve();
        } catch (err) {
          logger.error(`Error processing Student Courses CSV: ${err.message}`, { error: err });
          reject(err);
        }
      })
      .on('error', (err) => {
        logger.error(`Error reading Student Courses CSV: ${err.message}`, { error: err });
        reject(err);
      });
  });
}
