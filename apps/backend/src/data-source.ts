// apps/backend/src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

import { User } from './auth/models/user.model';
import { Survey } from './survey/models/survey.model';
import { Question } from './survey/models/question.model';
import { QuestionOption } from './survey/models/options.model';
import { Submission } from './survey/models/submission.model';
import { Answer } from './survey/models/answer.model';
import { SurveyToken } from './survey/models/survey-token.model';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { RefreshToken } from './auth/models/refresh-token.model';
import { Tenant } from './tenant/models/tenant.model';
import { Membership } from './tenant/models/membership.model';

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
  namingStrategy: new SnakeNamingStrategy(),
  entities: [
    User,
    RefreshToken,
    Survey,
    Question,
    QuestionOption,
    Submission,
    Answer,
    SurveyToken,
    Tenant,
    Membership,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
