/** Shared client-side types. These mirror the API contract exactly. */

export type Role = 'STUDENT' | 'EXAMINER' | 'ADMIN';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'PENDING' | 'COMPLETED';
export type TaskSortField = 'dueDate' | 'createdAt' | 'priority' | 'title';
export type SortOrder = 'asc' | 'desc';
export type QuestionOption = 'A' | 'B' | 'C' | 'D';

export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  studentId: string;
  createdBy: string;
  /** Derived server-side: PENDING and past its due date. */
  isOverdue: boolean;
  /** True when a professor/admin created the task for this student. */
  assignedByAdmin: boolean;
  student?: { id: string; name: string; studentId: string | null; email: string };
  creator?: { id: string; name: string; role: string };
}

export interface TaskSummary {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
}

export interface StudentWithStats extends User {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface AdminStatistics {
  totalStudents: number;
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  completionRate: number;
}

export interface AdminDashboardData {
  statistics: AdminStatistics;
  recentTasks: Task[];
  studentProgress: StudentWithStats[];
}

export interface ExamQuestion {
  id: string;
  position: number;
  questionText: string;
  options: Record<QuestionOption, string>;
  subject: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  explanation?: string;
  correctOption?: QuestionOption;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'studentId' | 'role'>;
  answers: Record<string, QuestionOption>;
  score: number;
  totalQuestions: number;
  durationSeconds: number;
  startedAt: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSession {
  exam: {
    title: string;
    durationSeconds: number;
    totalQuestions: number;
  };
  questions: ExamQuestion[];
  latestAttempt: ExamAttempt | null;
}

export interface ExamDashboardData {
  statistics: {
    totalStudents: number;
    totalExaminers: number;
    totalQuestions: number;
    totalAttempts: number;
    averageScore: number;
  };
  questions: ExamQuestion[];
  attempts: ExamAttempt[];
}

export interface ExamQuestionPayload {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: QuestionOption;
  explanation?: string;
  subject: string;
  position: number;
  isActive?: boolean;
}

export interface SubmitExamPayload {
  startedAt?: string;
  elapsedSeconds?: number;
  answers: Record<string, QuestionOption>;
}

/** Query parameters accepted by the task list endpoints. */
export interface TaskQueryParams {
  status?: TaskStatus;
  priority?: Priority;
  subject?: string;
  search?: string;
  sortBy?: TaskSortField;
  order?: SortOrder;
  studentId?: string;
}

export interface TaskListResult {
  tasks: Task[];
  summary?: TaskSummary;
  subjects: string[];
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  subject: string;
  dueDate: string;
  priority: Priority;
}

export interface AdminAssignmentPayload extends CreateTaskPayload {
  assignTo: 'ALL' | string[];
}

/** Field-level validation errors returned by the API: `{ email: "..." }`. */
export type FieldErrors = Record<string, string>;

/** Normalised error thrown by the API client. */
export interface ApiErrorShape {
  message: string;
  status: number;
  fieldErrors?: FieldErrors;
}
