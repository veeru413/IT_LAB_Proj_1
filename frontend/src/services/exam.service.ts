import { api } from './api';
import type {
  ExamDashboardData,
  ExamAttempt,
  ExamQuestion,
  ExamQuestionPayload,
  ExamSession,
  SubmitExamPayload,
} from '@/types';

export const getSession = async (): Promise<ExamSession> => {
  const { data } = await api.get('/exam/session');
  return data.data;
};

export const submitExam = async (payload: SubmitExamPayload): Promise<{
  attempt: ExamAttempt;
  score: number;
  totalQuestions: number;
  percentage: number;
}> => {
  const { data } = await api.post('/exam/submit', payload);
  return data.data;
};

export const getAdminDashboard = async (): Promise<ExamDashboardData> => {
  const { data } = await api.get('/admin/exam/dashboard');
  return data.data;
};

export const listQuestions = async (): Promise<ExamQuestion[]> => {
  const { data } = await api.get('/admin/exam/questions');
  return data.data;
};

export const createQuestion = async (payload: ExamQuestionPayload): Promise<ExamQuestion> => {
  const { data } = await api.post('/admin/exam/questions', payload);
  return data.data;
};

export const updateQuestion = async (
  id: string,
  payload: Partial<ExamQuestionPayload>,
): Promise<ExamQuestion> => {
  const { data } = await api.put(`/admin/exam/questions/${id}`, payload);
  return data.data;
};

export const deleteQuestion = async (id: string): Promise<void> => {
  await api.delete(`/admin/exam/questions/${id}`);
};
