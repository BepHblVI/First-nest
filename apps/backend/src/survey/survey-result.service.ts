import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './models/survey.model';
import { Submission } from './models/submission.model';
import { Answer } from './models/answer.model';
import { SurveyResult } from './dto/result.output';
import { User } from '../auth/user.model';

@Injectable()
export class SurveyResultService {
  constructor(
    @InjectRepository(Survey) private surveyRepo: Repository<Survey>,
    @InjectRepository(Submission) private submitRepo: Repository<Submission>,
    @InjectRepository(Answer) private answerRepo: Repository<Answer>,
  ) {}

  async getResults(shareId: string, currentUser: User): Promise<SurveyResult> {
    const survey = await this.surveyRepo.findOne({
      where: { shareId },
      relations: ['questions', 'questions.options', 'owner'],
    });
    if (!survey) throw new NotFoundException('アンケートが見つかりません');
    if (survey.owner.id !== currentUser.id) {
      throw new ForbiddenException(
        '他人のアンケートを操作する権限がありません',
      );
    }

    const totalSubmissions = await this.submitRepo.count({
      where: { survey: { id: survey.id } },
    });

    const rawQuestionCounts = await this.answerRepo
      .createQueryBuilder('answer')
      .innerJoin('answer.question', 'question')
      .select('question.id', 'questionId')
      .addSelect('COUNT(answer.id)', 'count')
      .where('question.surveyId = :sId', { sId: survey.id })
      .groupBy('question.id')
      .getRawMany();

    const rawOptionCounts = await this.answerRepo
      .createQueryBuilder('answer')
      .innerJoin('answer.selectedOptions', 'option')
      .select('option.id', 'optionId')
      .innerJoin('answer.question', 'question')
      .addSelect('COUNT(answer.id)', 'count')
      .where('question.surveyId = :sId', { sId: survey.id })
      .groupBy('option.id')
      .getRawMany();

    return this.buildResult(
      survey,
      totalSubmissions,
      rawQuestionCounts,
      rawOptionCounts,
    );
  }

  /** 集計結果の組み立て(純粋関数。単独でテスト可) */
  private buildResult(
    survey: Survey,
    totalSubmissions: number,
    rawQuestionCounts: { questionId: number; count: string }[],
    rawOptionCounts: { optionId: number; count: string }[],
  ): SurveyResult {
    const questions = survey.questions.map((question) => {
      const totalAnswers = Number(
        rawQuestionCounts.find((q) => q.questionId === question.id)?.count ?? 0,
      );
      const options =
        question.options?.map((opt) => {
          const found = rawOptionCounts.find((r) => r.optionId === opt.id);
          const count = found ? Number(found.count) : 0;
          return {
            optionId: opt.id,
            text: opt.text,
            count,
            percentage: totalAnswers > 0 ? (count / totalAnswers) * 100 : 0,
          };
        }) ?? [];

      return {
        questionId: question.id,
        qtext: question.qtext,
        type: question.type,
        totalAnswersForThisQuestion: totalAnswers,
        options,
      };
    });

    return {
      surveyId: survey.id,
      title: survey.title,
      totalSubmissions,
      questions,
    };
  }

  /**
   * 指定アンケートの回答件数を返す。
   * 個別の回答内容は返さず件数のみ。集計表示やフロントの一覧バッジで利用する。
   */
  async countSubmissions(surveyId: number): Promise<number> {
    return this.submitRepo.count({
      where: { survey: { id: surveyId } },
    });
  }
}
