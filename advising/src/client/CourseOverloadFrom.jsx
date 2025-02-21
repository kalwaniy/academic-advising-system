/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import './styles/index.css';

function CourseOverload() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    uid: '',
    cgpa: '',
    semester: '',
    // Two arrays: focusSubjects + selectedCourses
    focusSubjects: [],
    selectedCourses: [],
    totalCredits: 0,
    reason: '',
  });

  // For storing the final "overloadSubjects" as a JSON or string
  // We'll store the "focusSubjects" in the DB column "overload_subjects"
  // (or you can store them as a text field if you prefer)

  const semesterOptions = [
    { value: 'Spring', label: 'Spring' },
    { value: 'Fall', label: 'Fall' },
    { value: 'Summer', label: 'Summer' },
  ];

  const [courses, setCourses] = useState([]);

  useEffect(() => {
    // 1. Fetch student data
    fetch('http://localhost:5000/api/student-data', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error fetching student data: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setFormData((prevData) => ({
          ...prevData,
          name: `${data.first_name} ${data.last_name}`,
          email: data.email_id,
          uid: data.university_id,
          cgpa: data.CGPA,
        }));
      })
      .catch((err) => console.error('Error fetching student data:', err));

    // 2. Fetch courses with credits
    fetch('http://localhost:5000/api/courses', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error fetching courses: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const mapped = data.map((course) => {
          const safeCredits = course.credits ?? 3;
          return {
            value: course.course_code,
            label: `${course.course_code} - ${course.course_title} (${safeCredits} credits)`,
            credits: safeCredits,
          };
        });
        setCourses(mapped);
      })
      .catch((err) => console.error('Error fetching courses:', err));
  }, []);

  // A helper to sum the credits from an array of selected courses
  const calcTotalCredits = (courseArray) => {
    return courseArray.reduce((sum, c) => sum + c.credits, 0);
  };

  // 3. Handling the Semester single-select
  const handleSemesterChange = (selectedOption) => {
    setFormData({ ...formData, semester: selectedOption.value });
  };

  // 4. "Focus" multi-select
  // We automatically add these to the main "selectedCourses"
  const handleFocusChange = (selectedFocus) => {
    if (!selectedFocus) {
      selectedFocus = [];
    }

    // Add them to the "focusSubjects" array
    // Then we also ensure they are in "selectedCourses"
    // We'll combine them with the existing selectedCourses
    // and remove duplicates by "value" 
    // (we can do a simple approach below).

    // Convert the new focus to a map
    const focusMap = new Map(selectedFocus.map((f) => [f.value, f]));
    // Convert existing selectedCourses to a map
    const currentMap = new Map(formData.selectedCourses.map((c) => [c.value, c]));

    // Merge them: 
    // 1) Insert all from currentMap
    // 2) Insert all from focusMap
    const mergedMap = new Map([...currentMap, ...focusMap]);

    // Convert back to an array
    const mergedArray = Array.from(mergedMap.values());

    // Recalc the total credits
    const total = calcTotalCredits(mergedArray);

    setFormData({
      ...formData,
      focusSubjects: selectedFocus,
      selectedCourses: mergedArray,
      totalCredits: total,
    });
  };

  // 5. "Courses to Overload" multi-select
  // This can also add or remove courses from the main array 
  // but we need to ensure that if we remove a course which is in "focusSubjects", 
  // we keep it or ask user? 
  // We'll do the simplest approach: 
  // If user unselects something from selectedCourses that is in focus, we keep it in focus anyway 
  // but re-add it. 
  // For simplicity, let's do this:
  const handleCoursesChange = (selectedOptions) => {
    if (!selectedOptions) {
      selectedOptions = [];
    }

    // If there's anything in focusSubjects that isn't in selectedOptions, 
    // we re-add it because user can't remove a focus subject from the main list. 
    // Or if you want them to remove it, you can allow that. 
    // We'll do the approach that merging is one direction only from focus -> main. 
    // If user picks from main, we keep it. 
    // If user unpicks from main, we remove it unless it's in focus. 
    const focusMap = new Map(formData.focusSubjects.map((f) => [f.value, f]));
    // Filter out the focus from removal
    const combined = new Map(selectedOptions.map((c) => [c.value, c]));

    // Ensure all focus are present:
    for (const [val, fObj] of focusMap) {
      combined.set(val, fObj);
    }

    const finalArray = Array.from(combined.values());
    const total = calcTotalCredits(finalArray);

    setFormData({
      ...formData,
      selectedCourses: finalArray,
      totalCredits: total,
    });
  };

  // 6. handle text area "reason"
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 7. onSubmit
  const handleSubmit = (e) => {
    e.preventDefault();

    // Build a FormData
    const submitData = new FormData();
    submitData.append('submitted_by', formData.uid);
    submitData.append('semester', formData.semester);
    submitData.append('total_credits', formData.totalCredits);
    submitData.append('reason', formData.reason);

    // Convert focusSubjects into a JSON or comma separated
    // so the back end can store it in "overload_subjects" column
    // Example: JSON string
    const focusCodes = formData.focusSubjects.map((f) => f.value);
    submitData.append('overload_subjects', JSON.stringify(focusCodes));

    // Convert selectedCourses for the main list
    const selectedCourseCodes = formData.selectedCourses.map((c) => c.value);
    submitData.append('selected_courses', JSON.stringify(selectedCourseCodes));

    fetch('http://localhost:5000/api/course-overload/submit', {
      method: 'POST',
      body: submitData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error submitting form: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          alert('Course overload request submitted successfully!');
          // Optionally navigate or reset form
        } else {
          alert('Error submitting overload request.');
        }
      })
      .catch((err) => console.error('Error submitting form:', err));
  };

  return (
    <div className="waiver-container">
      <div className="main-content">
        <div className="form-container">
          <h1>Course Overload Form</h1>
          <form onSubmit={handleSubmit} className="waiver-form">
            <label>
              Name:
              <input
                type="text"
                name="name"
                value={formData.name}
                readOnly
                required
              />
            </label>

            <label>
              Email:
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                required
              />
            </label>

            <label>
              University ID (UID):
              <input
                type="text"
                name="uid"
                value={formData.uid}
                readOnly
                required
              />
            </label>

            <label>
              Cumulative GPA (CGPA):
              <input
                type="number"
                step="0.01"
                name="cgpa"
                value={formData.cgpa}
                readOnly
                required
              />
            </label>

            <label>
              Semester:
              <Select
                options={semesterOptions}
                onChange={handleSemesterChange}
                placeholder="Select a semester..."
                isSearchable
                required
              />
            </label>

            {/* FIRST MULTI-SELECT: FOCUS subjects */}
            <label>
              Which Subject(s) Specifically? (Focus Overload)
              <Select
                options={courses}
                onChange={handleFocusChange}
                value={formData.focusSubjects}
                placeholder="Pick the key subject(s)"
                isMulti
                isSearchable
              />
            </label>

            {/* SECOND MULTI-SELECT: All courses to Overload (some might come from focus) */}
            <label>
              Total Courses:
              <Select
                options={courses}
                onChange={handleCoursesChange}
                value={formData.selectedCourses}
                placeholder="Select one or more courses..."
                isMulti
                isSearchable
                required
              />
            </label>

            <label>
              Total Credits:
              <input
                type="number"
                name="totalCredits"
                value={formData.totalCredits}
                readOnly
              />
            </label>

            <label>
              Reason for Overload:
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                required
              />
            </label>

            <button type="submit">Submit Overload Request</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CourseOverload;
