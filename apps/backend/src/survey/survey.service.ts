import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Survey, SurveyAuthType } from './models/survey.model';
import { Submission } from './models/submission.model';
import { SurveyToken } from './models/survey-token.model';
import { User } from '../auth/user.model';
import {
  CreateSurveyInput,
  EditSurveyInput,
  SubmitSurveyAnswerInput,
} from './dto/inputs';
import { AnswerValidator } from './validators/answer.validator';
import { buildTokenEntities, mapQuestionInputs } from './helpers/survey-mapper';

const FULL_SURVEY_RELATIONS = [
  'owner',
  'questions',
  'questions.options',
  'tokens',
  'submissions',
];

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepo: Repository<Survey>,
    private dataSource: DataSource,
    private validator: AnswerValidator,
  ) {}

  async getData(user: User): Promise<Survey[]> {
    return this.surveyRepo.find({
      where: { owner: { id: user.id } },
      relations: FULL_SURVEY_RELATIONS,
    });
  }

  async createData(input: CreateSurveyInput, user: User): Promise<Survey> {
    const newSurvey = this.surveyRepo.create({
      title: input.title,
      owner: { id: user.id },
      questions: mapQuestionInputs(input.questions),
      published: input.published,
      auth: input.auth,
      tokens: buildTokenEntities(input.auth, input.tokens),
    });
    return this.surveyRepo.save(newSurvey);
  }

  async editData(input: EditSurveyInput, user: User): Promise<Survey> {
    return this.dataSource.transaction(async (manager) => {
      const survey = await this.findOwnedSurveyOrThrow(
        manager,
        input.id,
        user,
        FULL_SURVEY_RELATIONS,
      );

      if (survey.submissions?.length) {
        throw new ForbiddenException(
          'すでに回答されているアンケートは編集できません',
        );
      }

      // 既存の質問・トークンは全て差し替え
      await manager.remove(survey.questions);
      if (survey.tokens.length) {
        await manager.remove(survey.tokens);
      }

      const edited = manager.create(Survey, {
        id: input.id,
        title: input.title,
        owner: { id: user.id },
        questions: mapQuestionInputs(input.questions),
        auth: input.auth,
        tokens: buildTokenEntities(input.auth, input.tokens),
      });
      return manager.save(Survey, edited);
    });
  }

  async deleteData(id: number, user: User): Promise<boolean> {
    await this.findOwnedSurveyOrThrow(this.surveyRepo.manager, id, user);
    await this.surveyRepo.delete(id);
    return true;
  }

  async togglePublished(
    id: number,
    user: User,
    published: boolean,
  ): Promise<Survey> {
    const survey = await this.findOwnedSurveyOrThrow(
      this.surveyRepo.manager,
      id,
      user,
    );
    survey.published = published;
    return this.surveyRepo.save(survey);
  }

  async submitAnswer(input: SubmitSurveyAnswerInput): Promise<Submission> {
    return this.dataSource.transaction(async (manager) => {
      const survey = await manager.findOne(Survey, {
        where: { id: input.surveyId },
        relations: ['questions', 'questions.options'],
      });
      if (!survey) {
        throw new NotFoundException('アンケートが見つかりません');
      }
      if (!survey.published) {
        throw new ForbiddenException('このアンケートは非公開です');
      }

      if (survey.auth === SurveyAuthType.PRIVATE) {
        await this.consumeToken(manager, input.surveyId, input.token);
      }

      this.validator.validate(survey.questions, input.answers);

      const newSubmission = manager.create(Submission, {
        survey: { id: input.surveyId },
        answers: input.answers.map((ans) => ({
          question: { id: ans.questionId },
          text: ans.text ?? undefined,
          selectedOptions: ans.selectionIds?.map((id) => ({ id })) ?? [],
        })),
        respondentId: input.respondentId,
      });
      return manager.save(Submission, newSubmission);
    });
  }

  async getSurveyByShareId(shareId: string): Promise<Survey> {
    const survey = await this.surveyRepo.findOne({
      where: { shareId },
      relations: ['questions', 'owner', 'questions.options'],
    });
    if (!survey) {
      throw new NotFoundException('アンケートが見つかりません');
    }
    if (!survey.published) {
      throw new ForbiddenException('このアンケートは非公開です');
    }
    return survey;
  }

  // ── private helpers ─────────────────────────────────────

  /** ID指定でアンケートを取得しつつ「存在チェック+所有者チェック」を行う */
  private async findOwnedSurveyOrThrow(
    manager: EntityManager,
    id: number,
    user: User,
    relations: string[] = ['owner'],
  ): Promise<Survey> {
    const survey = await manager.findOne(Survey, {
      where: { id },
      relations,
    });
    if (!survey) {
      throw new NotFoundException('アンケートが見つかりません');
    }
    if (survey.owner.id !== user.id) {
      throw new ForbiddenException(
        '他人のアンケートを操作する権限がありません',
      );
    }
    return survey;
  }

  /** トークンを1件「使用済み」にマークする(原子的更新) */
  private async consumeToken(
    manager: EntityManager,
    surveyId: number,
    token: string | undefined,
  ): Promise<void> {
    if (!token) {
      throw new ForbiddenException('このアンケートへの回答権限がありません');
    }
    const result = await manager.update(
      SurveyToken,
      { token, survey: surveyId, isUsed: false },
      { isUsed: true },
    );
    if (result.affected === 0) {
      throw new ForbiddenException('無効なトークン、またはすでに回答済みです');
    }
  }
}
