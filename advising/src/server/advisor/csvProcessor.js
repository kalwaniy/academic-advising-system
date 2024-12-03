/* eslint-disable no-unused-vars */
// csvProcessor.js

import fs from 'fs';
import csv from 'csv-parser';
import db from '../db/db.js'; // Adjust the path based on your project structure
import logger, { logWithRequestContext } from '../utils/logger.js';

// Helper function to generate a unique university_id
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

// Function to process the first CSV file (Student Demographics and Academic Info)
export async function processStudentInfoCSV(filePath) {
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
                // Map CSV fields to variables with safe access and trimming
                const university_id = row['ID'] ? row['ID'].trim() : null;
                if (!university_id || !/^\d{9}$/.test(university_id)) {
                  throw new Error(`Invalid university_id at row ${rowCount}: ${university_id}`);
                }
  
                const last_name = row['Last Name'] ? row['Last Name'].trim() : '';
                const first_name = row['First Name'] ? row['First Name'].trim() : '';
                const email_id = row['Email'] ? row['Email'].trim() : '';
                const gender = row['Sex'] ? row['Sex'].trim() : '';
                const program = row['Acad Prog'] ? row['Acad Prog'].trim() : '';
                const career = row['Career'] ? row['Career'].trim() : '';
                const status = row['Status'] ? row['Status'].trim() : '';
                const campus = row['Campus'] ? row['Campus'].trim() : '';
                const major_academic_plan = row['MAJ Acad Plan'] ? row['MAJ Acad Plan'].trim() : '';
                const current_semester_year = row['Current Term Enroll'] ? row['Current Term Enroll'].trim() : '';
                const year_enrolled = row['First Term Enroll'] ? row['First Term Enroll'].trim() : '';
                const year_level = row['Year Level'] ? parseInt(row['Year Level'].trim(), 10) : null;
                const total_cumulative_units = row['Total Cumulative Units'] ? parseFloat(row['Total Cumulative Units'].trim()) : null;
                const transfer_credits = row['Transfer'] ? parseFloat(row['Transfer'].trim()) : null;
                const CGPA = row['GPA'] ? parseFloat(row['GPA'].trim()) : null;
                const primary_advisor_name = row['Primary Advisor'] ? row['Primary Advisor'].trim() : '';
                const faculty_advisor_name = row['Faculty Advisor'] ? row['Faculty Advisor'].trim() : '';
  
                // Validate required fields
                if (!first_name || !last_name) {
                  throw new Error(`Missing first name or last name at row ${rowCount}`);
                }
  
                // Insert or update 'students' table
                try {
                  await db.query(
                    'REPLACE INTO students (university_id, first_name, last_name, email_id, gender) VALUES (?, ?, ?, ?, ?)',
                    [university_id, first_name, last_name, email_id, gender]
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
  
                // Insert or update 'student_academic_info' table
                try {
                  await db.query(
                    `REPLACE INTO student_academic_info 
                      (university_id, program, year_enrolled, current_semester_year, year_level, total_cumulative_units, transfer_credits, CGPA, career, status, campus, major_academic_plan)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                      university_id,
                      program,
                      year_enrolled,
                      current_semester_year,
                      year_level,
                      total_cumulative_units,
                      transfer_credits,
                      CGPA,
                      career,
                      status,
                      campus,
                      major_academic_plan,
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
  
                // Handle Primary Advisor
                if (primary_advisor_name) {
                  try {
                    // Split the advisor name into first and last name
                    const advisorNameParts = primary_advisor_name.split(' ');
                    const advisor_first_name = advisorNameParts[0];
                    const advisor_last_name = advisorNameParts.slice(1).join(' ');
  
                    // Check if advisor exists
                    const [advisorRows] = await db.query(
                      'SELECT university_id FROM academic_advisors WHERE first_name = ? AND last_name = ?',
                      [advisor_first_name, advisor_last_name]
                    );
  
                    let advisor_id;
                    if (advisorRows.length > 0) {
                      advisor_id = advisorRows[0].university_id;
                    } else {
                      // Insert new advisor
                      advisor_id = await generateUniqueID();
                      await db.query(
                        'INSERT INTO academic_advisors (university_id, first_name, last_name, email_id, department) VALUES (?, ?, ?, ?, ?)',
                        [advisor_id, advisor_first_name, advisor_last_name, '', 'CIT']
                      );
                    }
  
                    // Insert or update 'advisor_student_relation' table
                    await db.query(
                      'REPLACE INTO advisor_student_relation (student_id, advisor_id, relationship_type) VALUES (?, ?, ?)',
                      [university_id, advisor_id, 'Academic']
                    );
                  } catch (advisorError) {
                    logger.warn(`Error processing primary advisor at row ${rowCount}: ${advisorError.message}`, {
                      rowNumber: rowCount,
                      rowData: row,
                      error: advisorError,
                    });
                    // Continue processing, since advisor error may not be critical
                  }
                }
  
                // Handle Faculty Advisor (if needed)
                if (faculty_advisor_name) {
                  try {
                    // Similar logic as for Primary Advisor, but with the 'faculty' table
                    const facultyNameParts = faculty_advisor_name.split(' ');
                    const faculty_first_name = facultyNameParts[0];
                    const faculty_last_name = facultyNameParts.slice(1).join(' ');
  
                    // Check if faculty exists
                    const [facultyRows] = await db.query(
                      'SELECT university_id FROM faculty WHERE first_name = ? AND last_name = ?',
                      [faculty_first_name, faculty_last_name]
                    );
  
                    let faculty_id;
                    if (facultyRows.length > 0) {
                      faculty_id = facultyRows[0].university_id;
                    } else {
                      // Insert new faculty member
                      faculty_id = await generateUniqueID();
                      await db.query(
                        'INSERT INTO faculty (university_id, first_name, last_name, email_id, department) VALUES (?, ?, ?, ?, ?)',
                        [faculty_id, faculty_first_name, faculty_last_name, '', 'CIT']
                      );
                    }
  
                    // Insert or update 'advisor_student_relation' table with relationship_type 'Faculty'
                    await db.query(
                      'REPLACE INTO advisor_student_relation (student_id, advisor_id, relationship_type) VALUES (?, ?, ?)',
                      [university_id, faculty_id, 'Faculty']
                    );
                  } catch (facultyError) {
                    logger.warn(`Error processing faculty advisor at row ${rowCount}: ${facultyError.message}`, {
                      rowNumber: rowCount,
                      rowData: row,
                      error: facultyError,
                    });
                    // Continue processing, since faculty advisor error may not be critical
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
export async function processStudentCoursesCSV(filePath) {
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
                  if (
                    [
                      'Entry Term',
                      'TermID',
                      'PreU Courses',
                      'year level',
                      'student id',
                      'LastName',
                      'First Name',
                      'Middle Name',
                      'ITS Username',
                      // Add any other non-course columns
                    ].includes(key)
                  ) {
                    continue; // Skip non-course columns
                  }
  
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