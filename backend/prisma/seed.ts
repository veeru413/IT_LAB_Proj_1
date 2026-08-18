/**
 * Database seed - creates demo accounts and a realistic set of assignments.
 *
 * ---------------------------------------------------------------------------
 * DEVELOPMENT / DEMO CREDENTIALS ONLY.
 * These accounts exist so the project is demonstrable straight after cloning.
 * Never ship this seed, or these passwords, to a production environment.
 * ---------------------------------------------------------------------------
 *
 * Run with:  npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_PASSWORD = 'Admin@123';
const EXAMINER_PASSWORD = 'Examiner@123';
const STUDENT_PASSWORD = 'Student@123';
const SALT_ROUNDS = 10;

/** Returns a date `days` from now (negative = in the past), at 23:59 local. */
const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 0, 0);
  return date;
};

interface SeedTask {
  title: string;
  description: string;
  subject: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'COMPLETED';
  dueInDays: number;
  /** true = created by the admin (a class assignment), false = personal task. */
  assignedByAdmin: boolean;
}

const seedTasksFor = (index: number): SeedTask[] => {
  const catalogue: SeedTask[][] = [
    [
      {
        title: 'Data Structures Assignment 3',
        description:
          'Implement AVL tree insertion and deletion in C++. Include time-complexity analysis for each operation and a short test report.',
        subject: 'Data Structures',
        priority: 'HIGH',
        status: 'PENDING',
        dueInDays: 4,
        assignedByAdmin: true,
      },
      {
        title: 'DBMS Normalization Worksheet',
        description:
          'Normalise the supplied relation up to BCNF. Show every functional dependency and justify each decomposition step.',
        subject: 'DBMS',
        priority: 'HIGH',
        status: 'PENDING',
        dueInDays: -2, // deliberately overdue so the OVERDUE badge is visible
        assignedByAdmin: true,
      },
      {
        title: 'Operating Systems Lab Record',
        description:
          'Write up the CPU scheduling experiments (FCFS, SJF, Round Robin) with Gantt charts and average waiting times.',
        subject: 'Operating Systems',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        dueInDays: -6,
        assignedByAdmin: false,
      },
      {
        title: 'Machine Learning Mini Project Report',
        description:
          'Train a logistic regression classifier on the student performance dataset and document precision, recall and F1.',
        subject: 'Machine Learning',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueInDays: 9,
        assignedByAdmin: false,
      },
      {
        title: 'Read chapter 4 - Computer Networks',
        description: 'Revise the transport layer before the surprise quiz. Focus on TCP congestion control.',
        subject: 'Computer Networks',
        priority: 'LOW',
        status: 'PENDING',
        dueInDays: 14,
        assignedByAdmin: false,
      },
    ],
    [
      {
        title: 'Data Structures Assignment 3',
        description:
          'Implement AVL tree insertion and deletion in C++. Include time-complexity analysis for each operation and a short test report.',
        subject: 'Data Structures',
        priority: 'HIGH',
        status: 'COMPLETED',
        dueInDays: 4,
        assignedByAdmin: true,
      },
      {
        title: 'DBMS Normalization Worksheet',
        description:
          'Normalise the supplied relation up to BCNF. Show every functional dependency and justify each decomposition step.',
        subject: 'DBMS',
        priority: 'HIGH',
        status: 'COMPLETED',
        dueInDays: -2,
        assignedByAdmin: true,
      },
      {
        title: 'Software Engineering Case Study',
        description:
          'Compare Waterfall and Agile for a hospital management system. Two pages, cite at least three sources.',
        subject: 'Software Engineering',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueInDays: 6,
        assignedByAdmin: false,
      },
      {
        title: 'Web Technologies Practical',
        description: 'Build a responsive portfolio page using semantic HTML and CSS grid. No frameworks allowed.',
        subject: 'Web Technologies',
        priority: 'LOW',
        status: 'PENDING',
        dueInDays: 11,
        assignedByAdmin: false,
      },
    ],
    [
      {
        title: 'Data Structures Assignment 3',
        description:
          'Implement AVL tree insertion and deletion in C++. Include time-complexity analysis for each operation and a short test report.',
        subject: 'Data Structures',
        priority: 'HIGH',
        status: 'PENDING',
        dueInDays: 4,
        assignedByAdmin: true,
      },
      {
        title: 'DBMS Normalization Worksheet',
        description:
          'Normalise the supplied relation up to BCNF. Show every functional dependency and justify each decomposition step.',
        subject: 'DBMS',
        priority: 'HIGH',
        status: 'PENDING',
        dueInDays: -2,
        assignedByAdmin: true,
      },
      {
        title: 'Discrete Mathematics Problem Set',
        description: 'Solve the graph theory problems from tutorial sheet 5. Show full working for each proof.',
        subject: 'Discrete Mathematics',
        priority: 'MEDIUM',
        status: 'PENDING',
        dueInDays: -1,
        assignedByAdmin: false,
      },
      {
        title: 'Compiler Design Lab - Lexical Analyser',
        description: 'Implement a lexical analyser for a subset of C using Lex. Submit source plus sample output.',
        subject: 'Compiler Design',
        priority: 'HIGH',
        status: 'PENDING',
        dueInDays: 7,
        assignedByAdmin: false,
      },
      {
        title: 'Group presentation slides',
        description: 'Prepare 8 slides on cloud deployment models for the seminar session.',
        subject: 'Cloud Computing',
        priority: 'LOW',
        status: 'COMPLETED',
        dueInDays: -9,
        assignedByAdmin: false,
      },
    ],
  ];

  return catalogue[index % catalogue.length] ?? [];
};

const STUDENTS = [
  { name: 'Aarav Sharma', email: 'student1@college.local', studentId: 'CS21B001' },
  { name: 'Priya Nair', email: 'student2@college.local', studentId: 'CS21B002' },
  { name: 'Rahul Verma', email: 'student3@college.local', studentId: 'CS21B003' },
  { name: 'Sneha Iyer', email: 'student4@college.local', studentId: 'CS21B004' },
];

const EXAM_QUESTIONS = [
  {
    position: 1,
    questionText: 'What does MCQ stand for?',
    optionA: 'Multiple Choice Question',
    optionB: 'Main Course Quiz',
    optionC: 'Manual Choice Query',
    optionD: 'Marked Class Questionnaire',
    correctOption: 'A',
    subject: 'General',
  },
  {
    position: 2,
    questionText: 'Which HTML tag is used to create a line break?',
    optionA: '<hr>',
    optionB: '<br>',
    optionC: '<break>',
    optionD: '<lb>',
    correctOption: 'B',
    subject: 'Web Basics',
  },
  {
    position: 3,
    questionText: 'Which one is a JavaScript framework?',
    optionA: 'Laravel',
    optionB: 'Django',
    optionC: 'React',
    optionD: 'Flask',
    correctOption: 'C',
    subject: 'Web Basics',
  },
  {
    position: 4,
    questionText: 'What is the binary representation of decimal 5?',
    optionA: '101',
    optionB: '110',
    optionC: '100',
    optionD: '111',
    correctOption: 'A',
    subject: 'Computer Basics',
  },
  {
    position: 5,
    questionText: 'Which SQL keyword is used to fetch data from a table?',
    optionA: 'GET',
    optionB: 'SELECT',
    optionC: 'PICK',
    optionD: 'READ',
    correctOption: 'B',
    subject: 'DBMS',
  },
  {
    position: 6,
    questionText: 'What does CPU stand for?',
    optionA: 'Central Processing Unit',
    optionB: 'Computer Personal Unit',
    optionC: 'Control Program Utility',
    optionD: 'Central Program Upload',
    correctOption: 'A',
    subject: 'Computer Basics',
  },
  {
    position: 7,
    questionText: 'Which symbol is used for comments in JavaScript?',
    optionA: '//',
    optionB: '/* */ only',
    optionC: '#',
    optionD: '<!-- -->',
    correctOption: 'A',
    subject: 'Web Basics',
  },
  {
    position: 8,
    questionText: 'What is the output of 2 + 2 * 2?',
    optionA: '8',
    optionB: '6',
    optionC: '4',
    optionD: '2',
    correctOption: 'B',
    subject: 'Aptitude',
  },
  {
    position: 9,
    questionText: 'Which database is used in this project setup?',
    optionA: 'MongoDB',
    optionB: 'PostgreSQL',
    optionC: 'SQLite',
    optionD: 'MySQL',
    correctOption: 'C',
    subject: 'Project',
  },
  {
    position: 10,
    questionText: 'What does HTTP stand for?',
    optionA: 'HyperText Transfer Protocol',
    optionB: 'High Text Transmission Program',
    optionC: 'Hyper Transfer Task Process',
    optionD: 'Host Tool Transfer Protocol',
    correctOption: 'A',
    subject: 'Web Basics',
  },
];

async function main(): Promise<void> {
  console.log('Seeding database...\n');

  // Wipe existing rows so the seed is idempotent and repeatable.
  await prisma.examAttempt.deleteMany();
  await prisma.examQuestion.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  const [adminHash, examinerHash, studentHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS),
    bcrypt.hash(EXAMINER_PASSWORD, SALT_ROUNDS),
    bcrypt.hash(STUDENT_PASSWORD, SALT_ROUNDS),
  ]);

  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Meera Krishnan',
      email: 'admin@college.local',
      studentId: null, // admins have no roll number
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
  console.log(`  Admin created    : ${admin.email}`);

  const examiner = await prisma.user.create({
    data: {
      name: 'Ms. Ananya Rao',
      email: 'examiner@college.local',
      studentId: null,
      passwordHash: examinerHash,
      role: 'EXAMINER',
    },
  });
  console.log(`  Examiner created : ${examiner.email}`);

  let taskCount = 0;

  for (const [index, student] of STUDENTS.entries()) {
    const created = await prisma.user.create({
      data: {
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        passwordHash: studentHash,
        role: 'STUDENT',
      },
    });

    const tasks = seedTasksFor(index);

    await prisma.task.createMany({
      data: tasks.map((task) => ({
        title: task.title,
        description: task.description,
        subject: task.subject,
        priority: task.priority,
        status: task.status,
        dueDate: daysFromNow(task.dueInDays),
        studentId: created.id,
        // Class assignments are authored by the admin, personal tasks by the student.
        createdBy: task.assignedByAdmin ? admin.id : created.id,
      })),
    });

    taskCount += tasks.length;
    console.log(`  Student created  : ${created.email.padEnd(24)} (${tasks.length} tasks)`);
  }

  await prisma.examQuestion.createMany({
    data: EXAM_QUESTIONS.map((question) => ({
      ...question,
      explanation: '',
      isActive: true,
    })),
  });

  console.log(`\n  ${STUDENTS.length} students and ${taskCount} tasks seeded.`);
  console.log(`  ${EXAM_QUESTIONS.length} exam questions seeded.`);
  console.log('\n  ---------------------------------------------------------');
  console.log('   DEMO CREDENTIALS  (development only - do not use in prod)');
  console.log('  ---------------------------------------------------------');
  console.log(`   Admin    : admin@college.local     / ${ADMIN_PASSWORD}`);
  console.log(`   Examiner : examiner@college.local  / ${EXAMINER_PASSWORD}`);
  console.log(`   Student  : student1@college.local  / ${STUDENT_PASSWORD}`);
  console.log(`   Student  : student2@college.local  / ${STUDENT_PASSWORD}`);
  console.log(`   Student  : student3@college.local  / ${STUDENT_PASSWORD}`);
  console.log(`   Student  : student4@college.local  / ${STUDENT_PASSWORD}`);
  console.log('  ---------------------------------------------------------\n');
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
