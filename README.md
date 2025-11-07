This repository contains a curated selection of frontend and backend code from a larger university project. The full application includes multiple user roles, automated workflows for prerequisite and course overload requests, and a complete dashboard experience for students, advisors, faculty, department chairs, and higher administration.

Only representative source files are included here; the project is intentionally not runnable. Its purpose is to demonstrate coding style, architectural thinking, and UI structure.

Overview

The Academic Advising System was designed to streamline the process of submitting, reviewing, and approving academic waiver requests such as:

Prerequisite waivers

Course overload requests

Senior Design requests

COOP-related approvals

Multi-level academic review workflows

The system reduces administrative overhead by providing a single digital platform for request submission, status tracking, approvals, and communication across academic units.

Key Features
1. Multi-Role Access

The full system supports the following roles with role-specific dashboards:

Student

Academic Advisor

Faculty

Department Chair

Dean / VP

Each role has access to different views and actions in the approval workflow.

2. Automated Workflow

A request passes through several stages depending on the type and academic hierarchy.
Typical flow:

Student submits a request

Advisor reviews and forwards or rejects

Department Chair evaluates requirements

Faculty review for technical prerequisites

Dean/VP final approval

Status transitions and routing rules are defined per request type.

3. Centralized Student Dashboard

Students can:

Submit new waiver or overload requests

View request status in real time

Upload justifying documents

Receive notifications for updates

4. Reviewer Dashboards

Advisors, faculty, and chairs can:

Filter requests by status

Review justification and academic history

Add notes

Change request status

Forward to the next reviewer

5. Modular API Structure (Sample Included)

The backend (Node.js + Express + MySQL) follows a clean separation of:

Route handlers

Controllers

Middleware

Utility files

This repository includes sanitized examples of:

Route definitions

Database access pattern

Mail service abstraction 

Frontend

React

React Router

CSS modules/stylesheets

Context/state where applicable

Backend

Node.js

Express

MySQL (via mysql2)

Modular controller-based API design

Architecture Summary

The original project followed a client–server architecture:

Frontend:
React SPA with role-based navigation and component-based UI.

Backend:
Node.js + Express REST API with:

Middleware for access control

Request validation

Email notifications (abstracted)

MySQL for data storage
