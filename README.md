# Reimbursements-Management-System
Reimbursement Management System
Overview

The Reimbursement Management System is a web application by which employees are able to submit reimbursement claims for expenses like travel, food, and office supplies. Managers are able to review, approve or reject these claims.

Node.js is employed for the backend and uses local JSON file storage, and an elementary HTML/CSS/JavaScript frontend.

Features
For Employees:

Register and log in to the system.

Submit reimbursement claims with expense type, amount, and optional receipt upload.

See status of submitted claims (Pending, Approved, Rejected).

For Managers:

Login as manager.

See all employee reimbursement claims.

Approve or reject submitted claims.

General:

Persistent login with localStorage.

Simple and clean user interface.

Simple JSON-based backend (no database needed).

Technologies Used

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express

Storage: Local JSON file (db.json) for users and claims

Authentication: JWT (JSON Web Token)

File Upload: Multer

Password Security: bcryptjs
