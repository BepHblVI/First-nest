// apps/backend/src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { User } from './auth/user.model';
import { Survey } from './survey/models/survey.model';
import { Question } from './survey/models/question.model';
import { QuestionOption } from './survey/models/options.model';
import { Submission } from './survey/models/submission.model';
import { Answer } from './survey/models/answer.model';
import { SurveyToken } from './survey/models/survey-token.model';

dotenv.config({ path: '../../.env' });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: true,
  entities: [
    User,
    Survey,
    Question,
    QuestionOption,
    Submission,
    Answer,
    SurveyToken,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
