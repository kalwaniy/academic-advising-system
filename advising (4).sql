-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 04, 2024 at 02:05 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `advising`
--

-- --------------------------------------------------------

--
-- Table structure for table `academic_advisors`
--

CREATE TABLE `academic_advisors` (
  `university_id` char(9) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email_id` varchar(50) NOT NULL,
  `department` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `academic_advisors`
--

INSERT INTO `academic_advisors` (`university_id`, `first_name`, `last_name`, `email_id`, `department`) VALUES
('100000001', 'John', 'Doe', 'john.doe@rit.edu', 'CIT'),
('100000002', 'Jane', 'Smith', 'jane.smith@rit.edu', 'CIT');

-- --------------------------------------------------------

--
-- Table structure for table `advisor_student_relation`
--

CREATE TABLE `advisor_student_relation` (
  `student_id` char(9) NOT NULL,
  `advisor_id` char(9) NOT NULL,
  `relationship_type` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `advisor_student_relation`
--

INSERT INTO `advisor_student_relation` (`student_id`, `advisor_id`, `relationship_type`) VALUES
('123456789', '100000001', 'Academic'),
('223456789', '100000001', 'Academic'),
('234567890', '100000002', 'Academic');

-- --------------------------------------------------------

--
-- Table structure for table `coop_officers`
--

CREATE TABLE `coop_officers` (
  `university_id` char(9) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email_id` varchar(50) NOT NULL,
  `department` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `coop_officers`
--

INSERT INTO `coop_officers` (`university_id`, `first_name`, `last_name`, `email_id`, `department`) VALUES
('400000001', 'Michael', 'Cooper', 'michael.cooper@rit.edu', 'CIT');

-- --------------------------------------------------------

--
-- Table structure for table `coop_status`
--

CREATE TABLE `coop_status` (
  `student_id` char(9) NOT NULL,
  `coop_course` varchar(50) NOT NULL,
  `completed` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `coop_status`
--

INSERT INTO `coop_status` (`student_id`, `coop_course`, `completed`) VALUES
('123456789', 'COOP 1', 1),
('123456789', 'COOP 2', 1);

-- --------------------------------------------------------

--
-- Table structure for table `coop_verification`
--

CREATE TABLE `coop_verification` (
  `verification_id` bigint(20) UNSIGNED NOT NULL,
  `waiver_id` int(11) DEFAULT NULL,
  `student_id` char(9) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `verified_by` char(9) DEFAULT NULL,
  `verified_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `coop_verification`
--

INSERT INTO `coop_verification` (`verification_id`, `waiver_id`, `student_id`, `comments`, `verified_by`, `verified_at`) VALUES
(1, 1, '123456789', 'Both COOP terms completed successfully.', '400000001', '2024-10-09 16:49:18');

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `course_code` varchar(7) NOT NULL,
  `course_title` varchar(100) NOT NULL,
  `department` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`course_code`, `course_title`, `department`) VALUES
('CSCI140', 'Intro to Computer Science', 'CIT'),
('CSCI141', 'Intro to Programming', 'CIT'),
('CSCI142', 'Computer Science II', 'CIT'),
('CSCI242', 'Computer Science III', 'CIT'),
('CSCI320', 'Data Structures', 'CIT'),
('CSEC123', 'Cybersecurity 123', 'CIT'),
('GCIS123', 'GCIS Course 123', 'CIT'),
('GCIS124', 'GCIS Course 124', 'CIT'),
('GCIS127', 'Intermediate GCIS', 'CIT'),
('IGME102', 'Introduction to Media Computing', 'CIT'),
('IGME106', 'Interactive Design Basics', 'CIT'),
('IGME201', 'Introduction to Interactive Media', 'CIT'),
('IGME230', 'Advanced Media Programming', 'CIT'),
('IGME330', 'Game Development I', 'CIT'),
('ISTE120', 'Computational Problem Solving', 'CIT'),
('ISTE121', 'Web and Mobile I', 'CIT'),
('ISTE140', 'Introduction to Programming', 'CIT'),
('ISTE200', 'Computer Science Basics', 'CIT'),
('ISTE230', 'Data Management', 'CIT'),
('ISTE240', 'Software Development', 'CIT'),
('ISTE260', 'Design and Implementation', 'CIT'),
('ISTE262', 'Database Systems', 'CIT'),
('ISTE264', 'Database Design', 'CIT'),
('ISTE266', 'Data Modeling', 'CIT'),
('ISTE330', 'Intermediate Programming', 'CIT'),
('ISTE340', 'Data Warehousing', 'CIT'),
('ISTE341', 'Data Analytics', 'CIT'),
('ISTE430', 'Advanced Data Management', 'CIT'),
('ISTE432', 'Advanced Programming', 'CIT'),
('ISTE434', 'Systems Analysis', 'CIT'),
('ISTE436', 'Web Development III', 'CIT'),
('ISTE438', 'Enterprise Computing', 'CIT'),
('ISTE444', 'Machine Learning Basics', 'CIT'),
('ISTE470', 'Statistical Methods', 'CIT'),
('ISTE500', 'Capstone I', 'CIT'),
('ISTE501', 'Capstone II', 'CIT'),
('MATH251', 'Discrete Mathematics', 'CIT'),
('NACA172', 'Advanced Calculus', 'CIT'),
('NSSA102', 'Introduction to Networks', 'CIT'),
('NSSA220', 'Network Services', 'CIT'),
('NSSA221', 'Advanced Network Services', 'CIT'),
('NSSA241', 'Network Security Fundamentals', 'CIT'),
('NSSA242', 'Network Forensics', 'CIT'),
('NSSA244', 'Security Policy Management', 'CIT'),
('NSSA245', 'Network Troubleshooting', 'CIT'),
('NSSA290', 'Introduction to Cybersecurity', 'CIT'),
('NSSA320', 'Network Architecture', 'CIT'),
('NSSA322', 'Advanced Network Management', 'CIT'),
('NSSA342', 'Network Defense Strategies', 'CIT'),
('NSSA370', 'Advanced Network Security', 'CIT'),
('NSSA422', 'Network Monitoring and Management', 'CIT'),
('NSSA423', 'Applied Network Defense', 'CIT'),
('NSSA425', 'Wireless Networking', 'CIT'),
('NSSA427', 'Virtualization and Cloud Security', 'CIT'),
('NSSA441', 'Cloud Security', 'CIT'),
('NSSA443', 'Advanced Firewall Techniques', 'CIT'),
('STAT145', 'Statistics I', 'CIT'),
('SWEN123', 'Software Engineering 123', 'CIT'),
('SWEN262', 'Object-Oriented Programming', 'CIT'),
('SWEN383', 'Software Engineering Process', 'CIT');

-- --------------------------------------------------------

--
-- Table structure for table `course_prerequisites`
--

CREATE TABLE `course_prerequisites` (
  `course_code` varchar(7) NOT NULL,
  `prerequisite_course_code` varchar(7) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `course_prerequisites`
--

INSERT INTO `course_prerequisites` (`course_code`, `prerequisite_course_code`) VALUES
('GCIS124', 'CSEC123'),
('GCIS124', 'GCIS123'),
('GCIS124', 'SWEN123'),
('ISTE230', 'GCIS123'),
('ISTE240', 'GCIS123'),
('ISTE240', 'ISTE140'),
('ISTE260', 'ISTE140'),
('ISTE262', 'IGME230'),
('ISTE262', 'ISTE140'),
('ISTE262', 'NACA172'),
('ISTE264', 'ISTE262'),
('ISTE266', 'ISTE262'),
('ISTE330', 'CSCI140'),
('ISTE330', 'CSCI142'),
('ISTE330', 'CSCI242'),
('ISTE330', 'CSCI320'),
('ISTE330', 'GCIS124'),
('ISTE330', 'GCIS127'),
('ISTE330', 'ISTE120'),
('ISTE330', 'ISTE230'),
('ISTE340', 'CSCI140'),
('ISTE340', 'CSCI142'),
('ISTE340', 'GCIS124'),
('ISTE340', 'GCIS127'),
('ISTE340', 'IGME102'),
('ISTE340', 'IGME106'),
('ISTE340', 'IGME330'),
('ISTE340', 'ISTE121'),
('ISTE340', 'ISTE200'),
('ISTE340', 'ISTE240'),
('ISTE430', 'ISTE230'),
('ISTE432', 'ISTE330'),
('ISTE434', 'CSCI320'),
('ISTE434', 'ISTE230'),
('ISTE436', 'ISTE230'),
('ISTE438', 'CSCI320'),
('ISTE438', 'IGME330'),
('ISTE438', 'ISTE230'),
('ISTE438', 'ISTE240'),
('ISTE470', 'CSCI140'),
('ISTE470', 'CSCI142'),
('ISTE470', 'CSCI242'),
('ISTE470', 'GCIS124'),
('ISTE470', 'GCIS127'),
('ISTE470', 'IGME106'),
('ISTE470', 'IGME201'),
('ISTE470', 'ISTE121'),
('ISTE470', 'ISTE200'),
('ISTE470', 'MATH251'),
('ISTE470', 'STAT145'),
('ISTE501', 'ISTE500'),
('NSSA220', 'GCIS124'),
('NSSA220', 'ISTE121'),
('NSSA220', 'ISTE200'),
('NSSA221', 'GCIS124'),
('NSSA221', 'NSSA220'),
('NSSA221', 'NSSA241'),
('NSSA241', 'NSSA102'),
('NSSA242', 'NSSA241'),
('NSSA244', 'NSSA221'),
('NSSA244', 'NSSA241'),
('NSSA245', 'CSCI141'),
('NSSA245', 'GCIS123'),
('NSSA245', 'NSSA220'),
('NSSA245', 'NSSA221'),
('NSSA245', 'NSSA241'),
('NSSA320', 'CSCI141'),
('NSSA320', 'GCIS123'),
('NSSA320', 'NSSA220'),
('NSSA322', 'NSSA221'),
('NSSA342', 'NSSA245'),
('NSSA422', 'NSSA322'),
('NSSA423', 'CSCI140'),
('NSSA423', 'CSCI142'),
('NSSA423', 'CSCI242'),
('NSSA423', 'GCIS124'),
('NSSA423', 'GCIS127'),
('NSSA423', 'IGME102'),
('NSSA423', 'IGME106'),
('NSSA423', 'ISTE121'),
('NSSA423', 'ISTE200'),
('NSSA425', 'NSSA322'),
('NSSA427', 'ISTE444'),
('NSSA427', 'NSSA241'),
('NSSA427', 'NSSA290'),
('NSSA427', 'NSSA320'),
('NSSA441', 'NSSA241'),
('NSSA443', 'NSSA241');

-- --------------------------------------------------------

--
-- Table structure for table `department_chairs`
--

CREATE TABLE `department_chairs` (
  `university_id` char(9) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email_id` varchar(50) NOT NULL,
  `department` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `department_chairs`
--

INSERT INTO `department_chairs` (`university_id`, `first_name`, `last_name`, `email_id`, `department`) VALUES
('200000001', 'Alice', 'Johnson', 'alice.johnson@rit.edu', 'CIT');

-- --------------------------------------------------------

--
-- Table structure for table `faculty`
--

CREATE TABLE `faculty` (
  `university_id` char(9) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email_id` varchar(50) NOT NULL,
  `department` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faculty`
--

INSERT INTO `faculty` (`university_id`, `first_name`, `last_name`, `email_id`, `department`) VALUES
('300000001', 'Alan', 'Walker', 'alan.walker@rit.edu', 'CIT'),
('300000002', 'Betty', 'White', 'betty.white@rit.edu', 'CIT'),
('300000003', 'David', 'Smith', 'david.smith@rit.edu', 'CIT'),
('300000004', 'Laura', 'Miller', 'laura.miller@rit.edu', 'CIT'),
('300000005', 'James', 'Taylor', 'james.taylor@rit.edu', 'CIT'),
('300000006', 'Susan', 'Brown', 'susan.brown@rit.edu', 'CIT'),
('300000007', 'Paul', 'Anderson', 'paul.anderson@rit.edu', 'CIT');

-- --------------------------------------------------------

--
-- Table structure for table `faculty_courses`
--

CREATE TABLE `faculty_courses` (
  `faculty_id` char(9) NOT NULL,
  `course_code` varchar(7) NOT NULL,
  `term_offered` char(4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `faculty_courses`
--

INSERT INTO `faculty_courses` (`faculty_id`, `course_code`, `term_offered`) VALUES
('300000001', 'CSCI141', '2241'),
('300000001', 'CSCI142', '2241'),
('300000001', 'GCIS124', '2241'),
('300000001', 'IGME330', '2241'),
('300000001', 'ISTE264', '2241'),
('300000001', 'ISTE340', '2241'),
('300000001', 'ISTE500', '2241'),
('300000001', 'NSSA220', '2241'),
('300000001', 'NSSA425', '2241'),
('300000002', 'CSCI242', '2241'),
('300000002', 'ISTE121', '2241'),
('300000002', 'ISTE266', '2241'),
('300000002', 'ISTE341', '2241'),
('300000002', 'ISTE470', '2241'),
('300000002', 'ISTE501', '2241'),
('300000002', 'NSSA322', '2241'),
('300000002', 'NSSA427', '2241'),
('300000002', 'SWEN123', '2241'),
('300000003', 'CSEC123', '2241'),
('300000003', 'GCIS127', '2241'),
('300000003', 'ISTE200', '2241'),
('300000003', 'ISTE430', '2241'),
('300000003', 'NSSA244', '2241'),
('300000003', 'NSSA245', '2241'),
('300000003', 'NSSA290', '2241'),
('300000003', 'STAT145', '2241'),
('300000003', 'SWEN383', '2241'),
('300000004', 'GCIS123', '2241'),
('300000004', 'ISTE330', '2241'),
('300000004', 'ISTE432', '2241'),
('300000004', 'ISTE444', '2241'),
('300000004', 'MATH251', '2241'),
('300000004', 'NSSA221', '2241'),
('300000004', 'NSSA242', '2241'),
('300000004', 'NSSA370', '2241'),
('300000004', 'SWEN262', '2241'),
('300000005', 'CSCI320', '2241'),
('300000005', 'IGME201', '2241'),
('300000005', 'ISTE230', '2241'),
('300000005', 'ISTE262', '2241'),
('300000005', 'ISTE434', '2241'),
('300000005', 'NSSA241', '2241'),
('300000005', 'NSSA342', '2241'),
('300000005', 'NSSA422', '2241'),
('300000006', 'IGME106', '2241'),
('300000006', 'IGME230', '2241'),
('300000006', 'ISTE120', '2241'),
('300000006', 'ISTE240', '2241'),
('300000006', 'ISTE436', '2241'),
('300000006', 'NSSA102', '2241'),
('300000006', 'NSSA423', '2241'),
('300000006', 'NSSA441', '2241'),
('300000007', 'CSCI140', '2241'),
('300000007', 'IGME102', '2241'),
('300000007', 'ISTE140', '2241'),
('300000007', 'ISTE260', '2241'),
('300000007', 'ISTE438', '2241'),
('300000007', 'NACA172', '2241'),
('300000007', 'NSSA320', '2241'),
('300000007', 'NSSA443', '2241');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` bigint(20) UNSIGNED NOT NULL,
  `waiver_id` int(11) DEFAULT NULL,
  `recipient_id` char(9) DEFAULT NULL,
  `recipient_role` varchar(20) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `notification_status` varchar(20) DEFAULT 'Pending',
  `sent_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`notification_id`, `waiver_id`, `recipient_id`, `recipient_role`, `message`, `notification_status`, `sent_at`) VALUES
(1, 1, '400000001', 'COOP Officer', 'Request for COOP completion verification.', 'Pending', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `prerequisite_waivers`
--

CREATE TABLE `prerequisite_waivers` (
  `waiver_id` bigint(20) UNSIGNED NOT NULL,
  `request_id` int(11) DEFAULT NULL,
  `course_code` varchar(7) DEFAULT NULL,
  `course_title` varchar(100) DEFAULT NULL,
  `faculty_id` char(9) DEFAULT NULL,
  `reason_to_take` text DEFAULT NULL,
  `justification` text DEFAULT NULL,
  `senior_design_request` tinyint(1) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Pending',
  `term_requested` char(4) DEFAULT NULL,
  `coop_request` tinyint(1) DEFAULT NULL,
  `jd_document_path` varchar(255) DEFAULT NULL,
  `submitted_by` char(9) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prerequisite_waivers`
--

INSERT INTO `prerequisite_waivers` (`waiver_id`, `request_id`, `course_code`, `course_title`, `faculty_id`, `reason_to_take`, `justification`, `senior_design_request`, `status`, `term_requested`, `coop_request`, `jd_document_path`, `submitted_by`) VALUES
(1, 1, 'ISTE240', 'Software Development', '300000001', 'Need the course to graduate.', 'I have sufficient programming experience.', 0, 'Pending', NULL, NULL, NULL, NULL),
(6, NULL, 'CSCI141', 'Intro to Programming', '300000001', 'test', 'test', 0, 'Pending', 'test', 0, NULL, '123456789');

-- --------------------------------------------------------

--
-- Table structure for table `request_data_visibility`
--

CREATE TABLE `request_data_visibility` (
  `waiver_id` int(11) NOT NULL,
  `viewer_role` varchar(20) NOT NULL,
  `can_view_cgpa` tinyint(1) DEFAULT 0,
  `can_view_personal_info` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `request_data_visibility`
--

INSERT INTO `request_data_visibility` (`waiver_id`, `viewer_role`, `can_view_cgpa`, `can_view_personal_info`) VALUES
(1, 'Advisor', 1, 1),
(1, 'Chair', 1, 1),
(1, 'COOP Officer', 0, 1);

-- --------------------------------------------------------

--
-- Table structure for table `request_history`
--

CREATE TABLE `request_history` (
  `history_id` bigint(20) UNSIGNED NOT NULL,
  `waiver_id` int(11) DEFAULT NULL,
  `student_id` char(9) DEFAULT NULL,
  `action_by` varchar(50) DEFAULT NULL,
  `action_by_role` varchar(20) DEFAULT NULL,
  `action_taken` varchar(100) DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `action_timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `request_history`
--

INSERT INTO `request_history` (`history_id`, `waiver_id`, `student_id`, `action_by`, `action_by_role`, `action_taken`, `comments`, `action_timestamp`) VALUES
(1, 1, '123456789', '100000001', 'Advisor', 'Reviewed', 'Forwarded to COOP officer.', '2024-10-09 16:49:18');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `university_id` char(9) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email_id` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`university_id`, `first_name`, `last_name`, `email_id`) VALUES
('123456789', 'Misal', 'Kunhi', 'mmk8309@rit.edu'),
('223456789', 'Mary', 'Hernandez', 'mh7351@rit.edu'),
('234567890', 'John', 'Doe', 'jdd3012@rit.edu'),
('334567890', 'Joseph', 'Wilson', 'jaw1684@rit.edu'),
('445678901', 'William', 'Lopez', 'wl8145@rit.edu'),
('456789012', 'Robert', 'Brown', 'rjb1426@rit.edu'),
('556789012', 'Charles', 'Thomas', 'cat2739@rit.edu'),
('567890123', 'Jessica', 'Jones', 'jmj5834@rit.edu'),
('667890123', 'Barbara', 'Anderson', 'ba1287@rit.edu'),
('678901234', 'Michael', 'Johnson', 'mj2874@rit.edu');

-- --------------------------------------------------------

--
-- Table structure for table `student_academic_info`
--

CREATE TABLE `student_academic_info` (
  `university_id` char(9) NOT NULL,
  `program` varchar(10) DEFAULT 'CIT',
  `year_enrolled` char(4) DEFAULT NULL,
  `current_semester_year` char(4) DEFAULT NULL,
  `year_level` int(11) DEFAULT NULL,
  `CGPA` decimal(3,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_academic_info`
--

INSERT INTO `student_academic_info` (`university_id`, `program`, `year_enrolled`, `current_semester_year`, `year_level`, `CGPA`) VALUES
('123456789', 'CMITDU-BS', '2235', '2241', 2, 3.75),
('223456789', 'CMITDU-BS', '2255', '2255', 1, 1.90),
('234567890', 'CMITDU-BS', '2220', '2241', 3, 2.20),
('334567890', 'CMITDU-BS', '2240', '2241', 2, 3.55),
('445678901', 'CMITDU-BS', '2250', '2255', 1, 3.45),
('456789012', 'CMITDU-BS', '2245', '2251', 2, 3.80),
('556789012', 'CMITDU-BS', '2230', '2240', 3, 3.10),
('567890123', 'CMITDU-BS', '2250', '2255', 1, 3.00),
('667890123', 'CMITDU-BS', '2235', '2241', 2, 2.80),
('678901234', 'CMITDU-BS', '2240', '2250', 3, 3.60);

-- --------------------------------------------------------

--
-- Table structure for table `student_courses`
--

CREATE TABLE `student_courses` (
  `student_id` char(9) NOT NULL,
  `course_code` varchar(7) NOT NULL,
  `term_taken` char(4) NOT NULL,
  `grade` char(2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_courses`
--

INSERT INTO `student_courses` (`student_id`, `course_code`, `term_taken`, `grade`) VALUES
('123456789', 'GCIS124', '2241', 'A'),
('123456789', 'ISTE230', '2230', 'A-'),
('123456789', 'ISTE240', '2235', 'B+'),
('223456789', 'GCIS124', '2251', 'B'),
('234567890', 'ISTE121', '2235', 'B-'),
('234567890', 'ISTE200', '2240', 'A'),
('334567890', 'NSSA220', '2235', 'A'),
('334567890', 'NSSA241', '2240', 'B'),
('445678901', 'CSCI140', '2250', 'A-'),
('445678901', 'CSCI142', '2255', 'B+'),
('456789012', 'ISTE120', '2250', 'A'),
('456789012', 'ISTE330', '2245', 'B'),
('556789012', 'CSCI242', '2240', 'B'),
('556789012', 'ISTE430', '2245', 'A-'),
('567890123', 'NSSA221', '2251', 'C+'),
('567890123', 'NSSA320', '2251', 'B'),
('667890123', 'ISTE340', '2241', 'B-'),
('667890123', 'ISTE341', '2245', 'A'),
('678901234', 'ISTE262', '2245', 'A-'),
('678901234', 'SWEN383', '2240', 'B');

-- --------------------------------------------------------

--
-- Table structure for table `student_requests`
--

CREATE TABLE `student_requests` (
  `request_id` bigint(20) UNSIGNED NOT NULL,
  `student_id` char(9) DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_requests`
--

INSERT INTO `student_requests` (`request_id`, `student_id`, `submitted_at`) VALUES
(1, '123456789', '2024-10-09 16:49:18'),
(2, '223456789', '2024-10-09 16:49:18');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` char(9) NOT NULL,
  `username` varchar(255) NOT NULL,
  `passwd` varchar(100) NOT NULL,
  `role` enum('student','advisor','faculty','coordinator','dept_chair') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `passwd`, `role`) VALUES
('123456789', 'mmk8309@rit.edu', 'misal', 'student'),
('223456789', 'mh7351@rit.edu', 'mh7351', 'student'),
('234567890', 'jdd3012@rit.edu', 'b4c82ed629', 'student'),
('334567890', 'jaw1684@rit.edu', 'f73f830105', 'student'),
('445678901', 'wl8145@rit.edu', '07ca47722b', 'student'),
('456789012', 'rjb1426@rit.edu', '99bccc2143', 'student'),
('556789012', 'cat2739@rit.edu', '2665a4bd3b', 'student'),
('567890123', 'jmj5834@rit.edu', '594732fc69', 'student'),
('667890123', 'ba1287@rit.edu', '2055b6335e', 'student'),
('678901234', 'mj2874@rit.edu', '457f0715af', 'student');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_advisors`
--
ALTER TABLE `academic_advisors`
  ADD PRIMARY KEY (`university_id`);

--
-- Indexes for table `advisor_student_relation`
--
ALTER TABLE `advisor_student_relation`
  ADD PRIMARY KEY (`student_id`,`advisor_id`,`relationship_type`);

--
-- Indexes for table `coop_officers`
--
ALTER TABLE `coop_officers`
  ADD PRIMARY KEY (`university_id`);

--
-- Indexes for table `coop_status`
--
ALTER TABLE `coop_status`
  ADD PRIMARY KEY (`student_id`,`coop_course`);

--
-- Indexes for table `coop_verification`
--
ALTER TABLE `coop_verification`
  ADD PRIMARY KEY (`verification_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`course_code`);

--
-- Indexes for table `course_prerequisites`
--
ALTER TABLE `course_prerequisites`
  ADD PRIMARY KEY (`course_code`,`prerequisite_course_code`),
  ADD KEY `prerequisite_course_code` (`prerequisite_course_code`);

--
-- Indexes for table `department_chairs`
--
ALTER TABLE `department_chairs`
  ADD PRIMARY KEY (`university_id`);

--
-- Indexes for table `faculty`
--
ALTER TABLE `faculty`
  ADD PRIMARY KEY (`university_id`);

--
-- Indexes for table `faculty_courses`
--
ALTER TABLE `faculty_courses`
  ADD PRIMARY KEY (`faculty_id`,`course_code`,`term_offered`),
  ADD KEY `course_code` (`course_code`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`);

--
-- Indexes for table `prerequisite_waivers`
--
ALTER TABLE `prerequisite_waivers`
  ADD PRIMARY KEY (`waiver_id`),
  ADD KEY `fk_course_code` (`course_code`),
  ADD KEY `fk_submitted_by` (`submitted_by`),
  ADD KEY `fk_faculty_id` (`faculty_id`);

--
-- Indexes for table `request_data_visibility`
--
ALTER TABLE `request_data_visibility`
  ADD PRIMARY KEY (`waiver_id`,`viewer_role`);

--
-- Indexes for table `request_history`
--
ALTER TABLE `request_history`
  ADD PRIMARY KEY (`history_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`university_id`),
  ADD UNIQUE KEY `email_id` (`email_id`);

--
-- Indexes for table `student_academic_info`
--
ALTER TABLE `student_academic_info`
  ADD PRIMARY KEY (`university_id`);

--
-- Indexes for table `student_courses`
--
ALTER TABLE `student_courses`
  ADD PRIMARY KEY (`student_id`,`course_code`,`term_taken`),
  ADD KEY `fk_student_courses_course_code` (`course_code`);

--
-- Indexes for table `student_requests`
--
ALTER TABLE `student_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `request_id` (`request_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `coop_verification`
--
ALTER TABLE `coop_verification`
  MODIFY `verification_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `prerequisite_waivers`
--
ALTER TABLE `prerequisite_waivers`
  MODIFY `waiver_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `request_history`
--
ALTER TABLE `request_history`
  MODIFY `history_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `student_requests`
--
ALTER TABLE `student_requests`
  MODIFY `request_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `course_prerequisites`
--
ALTER TABLE `course_prerequisites`
  ADD CONSTRAINT `course_prerequisites_ibfk_1` FOREIGN KEY (`course_code`) REFERENCES `courses` (`course_code`),
  ADD CONSTRAINT `course_prerequisites_ibfk_2` FOREIGN KEY (`prerequisite_course_code`) REFERENCES `courses` (`course_code`);

--
-- Constraints for table `faculty_courses`
--
ALTER TABLE `faculty_courses`
  ADD CONSTRAINT `faculty_courses_ibfk_1` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`university_id`),
  ADD CONSTRAINT `faculty_courses_ibfk_2` FOREIGN KEY (`course_code`) REFERENCES `courses` (`course_code`);

--
-- Constraints for table `prerequisite_waivers`
--
ALTER TABLE `prerequisite_waivers`
  ADD CONSTRAINT `fk_course_code` FOREIGN KEY (`course_code`) REFERENCES `courses` (`course_code`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_faculty_id` FOREIGN KEY (`faculty_id`) REFERENCES `faculty` (`university_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_prerequisite_waivers_student` FOREIGN KEY (`submitted_by`) REFERENCES `students` (`university_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `students` (`university_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `fk_user_id` FOREIGN KEY (`university_id`) REFERENCES `users` (`user_id`);

--
-- Constraints for table `student_academic_info`
--
ALTER TABLE `student_academic_info`
  ADD CONSTRAINT `fk_student_academic_info_university_id` FOREIGN KEY (`university_id`) REFERENCES `students` (`university_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `student_courses`
--
ALTER TABLE `student_courses`
  ADD CONSTRAINT `fk_student_courses_course_code` FOREIGN KEY (`course_code`) REFERENCES `courses` (`course_code`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_student_courses_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`university_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
