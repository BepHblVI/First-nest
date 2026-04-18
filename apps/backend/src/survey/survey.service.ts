// apps/backend/src/practice/practice.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeepPartial } from 'typeorm';
import { Answer } from './models/answer.model';
import { Survey } from './models/survey.model';
import { User } from '../auth/user.model';
import { Submission } from './models/submission.model';
import { SurveyToken } from './models/survey-token.model';
import { SurveyResult } from './dto/result.output';
import {
  CreateSurveyInput,
  SubmitSurveyAnswerInput,
  EditSurveyInput,
} from './dto/input';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private surveyRepo: Repository<Survey>,
    @InjectRepository(Submission)
    private submitRepo: Repository<Submission>,
    @InjectRepository(Answer)
    private answerRepo: Repository<Answer>,
    @InjectRepository(SurveyToken)
    private tokenRepo: Repository<SurveyToken>,
  ) {}

  // 1. 作成したものを取得
  async getData(user: User): Promise<Survey[]> {
    return await this.surveyRepo.find({
      where: { owner: { id: user.id } },
      relations: ['owner', 'questions', 'questions.options', 'tokens'],
    });
  }

  // 2. アンケート作成
  async createData(
    { title, questions, auth, tokens }: CreateSurveyInput,
    user: User,
  ): Promise<Survey> {
    const tokenEntities =
      auth === 'PRIVATE' && tokens > 0
        ? Array.from({ length: tokens }).map(() => ({}))
        : [];
    const newSurvey = this.surveyRepo.create({
      title: title,
      owner: { id: user.id },
      questions: questions.map((q) => ({
        qtext: q.qtext,
        type: q.type,
        options:
          q.options?.map((t, index) => ({ text: t, order: index })) || [],
      })),
      published: true,
      auth: auth,
      tokens: tokenEntities,
    });

    return await this.surveyRepo.save(newSurvey);
  }

  async editData(
    { id, title, questions, published, auth, tokens }: EditSurveyInput,
    user: User,
  ): Promise<Survey> {
    // 1. 既存データを取得（questionsも含めて）
    const survey = await this.surveyRepo.findOne({
      where: { id: id },
      relations: ['owner', 'questions', 'questions.options'],
    });

    if (!survey) {
      throw new NotFoundException('アンケートが見つかりません');
    }

    if (survey.owner.id !== user.id) {
      throw new ForbiddenException(
        '他人のアンケートを操作する権限がありません',
      );
    }

    const tokenEntities =
      auth === 'INVITE_ONLY' && tokens > 0
        ? Array.from({ length: tokens }).map(() => ({}))
        : [];

    const editedsurvey = this.surveyRepo.create({
      id: id,
      title: title,
      owner: { id: user.id },
      questions: questions.map((q) => ({
        qtext: q.qtext,
        type: q.type,
        options:
          q.options?.map((t, index) => ({ text: t, order: index })) || [],
      })),
      published: published,
      auth: auth,
      tokens: tokenEntities,
    });

    // 4. save() で保存（エンティティを直接渡す）
    return await this.surveyRepo.save(editedsurvey);
  }

  async deleteData(id: number, currentUser: User) {
    const survey = await this.surveyRepo.findOne({
      where: { id: id },
      relations: ['owner'],
    });
    if (!survey) {
      throw new NotFoundException('アンケートが見つかりません');
    }
    if (survey.owner.id !== currentUser.id) {
      throw new ForbiddenException(
        '他人のアンケートを操作する権限がありません',
      );
    }
    await this.surveyRepo.delete(id);
    return true;
  }

  async submitAnswer({
    surveyId,
    answers,
    token,
    respondentId,
  }: SubmitSurveyAnswerInput): Promise<Submission> {
    const survey = await this.surveyRepo.findOne({
      where: { id: surveyId },
    });
    if (!survey) throw new NotFoundException('アンケートが見つかりません');
    if (!survey.published)
      throw new ForbiddenException('このアンケートは非公開です');
    if (survey.auth == 'PRIVATE') {
      if (!token)
        throw new ForbiddenException('このアンケートへの回答権限がありません');
      const updateResult = await this.tokenRepo.update(
        {
          token: token,
          survey: { id: surveyId },
          isUsed: false,
        },
        {
          isUsed: true,
        },
      );
      if (updateResult.affected === 0) {
        throw new ForbiddenException(
          '無効なトークン、またはすでに回答済みです',
        );
      }
    }
    const newSubmission = this.submitRepo.create({
      survey: { id: surveyId },
      answers: answers.map(
        (ans): DeepPartial<Answer> => ({
          question: { id: ans.questionId },
          text: ans.text || undefined,
          selectedOptions: ans.selectionIds?.map((id) => ({ id })) || [],
        }),
      ),
      respondentId: respondentId,
    });

    return await this.submitRepo.save(newSubmission);
  }

  async getSurveyByShareId(shareId: string): Promise<Survey> {
    const survey = await this.surveyRepo.findOne({
      where: { shareId: shareId },
      relations: ['questions', 'owner', 'questions.options'],
    });

    if (!survey) {
      throw new Error('アンケートが見つかりません');
    }

    if (!survey.published) {
      throw new ForbiddenException('このアンケートは非公開です');
    }
    return survey;
  }

  async getResults(shareId: string, currentUser: User): Promise<SurveyResult> {
    const survey = await this.surveyRepo.findOne({
      where: { shareId: shareId },
      relations: ['questions', 'questions.options', 'owner'],
    });

    if (!survey) {
      throw new NotFoundException('アンケートが見つかりません');
    }
    if (survey.owner.id !== currentUser.id) {
      throw new ForbiddenException(
        '他人のアンケートを操作する権限がありません',
      );
    }

    const totalSubmissions = await this.submitRepo.count({
      where: { survey: { id: survey.id } },
    });

    const rawQuestionsAnswerCounts = await this.answerRepo
      .createQueryBuilder('answer')
      .innerJoin('answer.question', 'question') // 中間テーブルを結合
      .select('question.id', 'questionId')
      .addSelect('COUNT(answer.id)', 'count')
      .where('question.surveyId = :sId', { sId: survey.id })
      .groupBy('question.id')
      .getRawMany();

    const rawOptionCounts = await this.answerRepo
      .createQueryBuilder('answer')
      .innerJoin('answer.selectedOptions', 'option') // 中間テーブルを結合
      .select('option.id', 'optionId') // 選択肢IDを取得
      .innerJoin('answer.question', 'question') // 中間テーブルを結合
      .addSelect('COUNT(answer.id)', 'count') // その選択肢が含まれる回答数をカウント
      .where('question.surveyId = :sId', { sId: survey.id }) // 現在の設問に絞る
      .groupBy('option.id') // 選択肢ごとにまとめる
      .getRawMany(); // 生データとして取得

    const questionResults = survey.questions.map((question) => {
      // この設問に対する回答総数
      const totalAnswers = Number(
        rawQuestionsAnswerCounts.find((q) => q.questionId === question.id)
          ?.count ?? 0,
      );
      const optionsResults =
        question.options?.map((opt) => {
          const found = rawOptionCounts.find((r) => r.optionId === opt.id);

          const count = found ? Number(found.count) : 0;
          const percentage =
            totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;

          return {
            optionId: opt.id,
            text: opt.text,
            count: count,
            percentage: percentage,
          };
        }) || [];

      return {
        questionId: question.id,
        qtext: question.qtext,
        type: question.type,
        totalAnswersForThisQuestion: totalAnswers,
        options: optionsResults,
      };
    });

    return {
      surveyId: survey.id,
      title: survey.title,
      totalSubmissions,
      questions: questionResults,
    };
  }
}
