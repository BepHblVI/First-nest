// apps/frontend/types/survey.ts

export type QuestionOption = {
  id: number;
  text: string;
};

export type Question = {
  id: number;
  qtext: string;
  type: string;
  required?: boolean;
  options?: QuestionOption[];
};

export type SurveyToken = {
  token: string;
  isUsed: boolean;
  createdAt: string;
};

export type Submission = {
  id: number;
};

export type Survey = {
  id: number;
  title: string;
  shareId: string;
  published: boolean;
  auth: 'PUBLIC' | 'PRIVATE';
  owner: { username: string };
  questions: Question[];
  tokens?: SurveyToken[];
  submissions?: Submission[];
};

export type SurveyAuthType = 'PUBLIC' | 'PRIVATE';
