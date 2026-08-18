# Exam System (MCQ)

## Project Overview

Exam System (MCQ) is a simple web-based examination platform where students can log in, take an online multiple-choice test, and receive marks after submission. The system is built in a basic client-server style, so the user interface stays on the front end while the exam logic, authentication, and data handling stay on the back end.

The main idea of the project is to keep the exam process clean and easy:

- a user logs in
- an examiner or admin manages the exam
- the student attempts the questions
- the system checks the answers
- the final score is shown immediately

---

## Features

### 1. Login

The login feature allows users to enter the system with a valid username and password. This helps the application identify whether the person is a student, examiner, or admin. After login, the system sends the user to the correct page based on their role.

### 2. Examiner

The examiner manages the question paper and controls the exam setup. This includes adding questions, checking the exam content, and making sure the test is ready before students start.

### 3. Admin

The admin has full control over the system. The admin can manage users, monitor activity, and keep the exam data organized. This role is mainly used for system-level control and maintenance.

### 4. Client-Server Architecture

The project follows a client-server model. The client side handles the screens the user sees, while the server side handles the logic, login validation, exam submission, answer checking, and database access. This keeps the project simple and easier to maintain.

### 5. Database

The database stores user details, question data, exam attempts, and scores. It helps the system keep records safely and retrieve them whenever needed.

### 6. Exam

The exam module shows the MCQ questions one by one or in a single paper view, depending on the design. Students can read each question and choose the correct answer before submitting the test.

### 7. Evaluation

After submission, the system compares the selected answers with the correct answers stored in the database. This step is done automatically, so there is no manual checking.

### 8. Scoring

The scoring feature calculates the final marks based on the number of correct answers. The score can be shown in percentage or in total marks, depending on the project requirement.

### 9. Timing

The timing feature controls how long a student can take the test. A countdown timer starts when the exam begins, and when the time is over, the paper is submitted automatically or the student is forced to submit.

### 10. 10 MCQ Questions

The exam contains 10 multiple-choice questions. Each question has one correct answer and a few wrong options. This keeps the exam short, easy to understand, and suitable for a small project demonstration.

---

## Technology Stack

### Frontend

- **React**: used to build the user interface with reusable components.
- **Vite**: used as the build tool because it starts fast and gives quick refresh during development.
- **TypeScript**: used to make the code safer and reduce simple mistakes.
- **Tailwind CSS**: used for styling the pages without writing long CSS files.
- **React Router**: used to move between login, exam, admin, and result pages.

### Backend

- **Node.js**: runs the server-side JavaScript.
- **Express**: handles API routes, request processing, and response sending.
- **TypeScript**: keeps the backend code structured and easier to maintain.
- **JWT**: used for login sessions so users stay authenticated after signing in.
- **bcrypt**: used to hash passwords before storing them.

### Database and ORM

- **Prisma**: acts as the bridge between the server and the database.
- **SQLite**: stores all project data in a small local database file.

### Validation and API Calls

- **Zod**: checks form input and request data before it reaches the main logic.
- **Axios**: sends requests from the frontend to the backend.

---

## How the Main Functions Work

### Login Function

1. The user enters email or username and password.
2. The frontend sends the data to the backend.
3. The backend checks whether the credentials are valid.
4. If the login is correct, a token is created.
5. The token is sent back to the frontend and used for later requests.

### Role Handling

The system separates users by role. A student can only take the exam and view results, an examiner can manage exam content, and an admin can manage the full system. This avoids confusion and keeps access simple.

### Exam Loading

When the student starts the test, the frontend requests the exam data from the server. The backend sends the 10 MCQ questions with the available options. The frontend then displays them in a clean format.

### Timer Function

The timer starts as soon as the exam begins. The remaining time is shown on the screen so the student knows how much time is left. When the timer reaches zero, the system can stop the test or auto-submit it.

### Answer Submission

After selecting the answers, the student clicks submit. The frontend sends the chosen options to the backend, and the backend stores the attempt and begins evaluation.

### Evaluation Function

The backend compares the student answers with the correct answers in the database. Each correct answer increases the score. Wrong answers are ignored or marked as incorrect depending on the design.

### Result Function

Once evaluation is complete, the backend returns the final score. The frontend displays the result so the student can immediately see how they performed.

### Admin and Examiner Functions

The admin and examiner modules are used to keep the exam content updated. They can add questions, edit question data, review records, and manage the exam flow without touching the student side of the system.

---

## Short Summary

This project is a simple MCQ exam system built with a modern web stack. It uses a client-server structure, stores data in a database, and includes login, exam handling, evaluation, scoring, and timing. The design is kept basic on purpose so the project is easy to understand, easy to present, and easy to explain in a viva or report.
