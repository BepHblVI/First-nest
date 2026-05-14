import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Survey } from './models/survey.model';
import { Question } from './models/question.model';
import { Submission } from './models/submission.model';
import { Answer } from './models/answer.model';
import { User } from '../auth/user.model';
import { CrossTabulationInput } from './dto/inputs';
import { CrossTabulationResult } from './dto/outputs';
import { QuestionType } from './models/question.model';

@Injectable()
export class CrossResultService {
  constructor(
    @InjectRepository(Survey) private surveyRepo: Repository<Survey>,
    @InjectRepository(Question) private questionRepo: Repository<Question>,
    @InjectRepository(Submission) private submitRepo: Repository<Submission>,
    @InjectRepository(Answer) private answerRepo: Repository<Answer>,
    private dataSource: DataSource,
  ) {}

  async getCrossResults(
    input: CrossTabulationInput,
    currentUser: User,
  ): Promise<CrossTabulationResult> {
    const survey = await this.surveyRepo.findOne({
      where: { id: input.surveyId },
      relations: ['questions', 'owner'],
    });
    if (!survey) throw new NotFoundException('アンケートが見つかりません');
    if (survey.owner.id !== currentUser.id) {
      throw new ForbiddenException(
        '他人のアンケートを操作する権限がありません',
      );
    }
    const rowQuestion = await this.questionRepo.findOne({
      where: { id: input.rowQuestionId },
      relations: { options: true, survey: true },
    });
    const columnQuestion = await this.questionRepo.findOne({
      where: { id: input.columnQuestionId },
      relations: { options: true, survey: true },
    });
    if (!rowQuestion || !columnQuestion)
      throw new NotFoundException('集計する質問が見つかりません');

    if (
      rowQuestion.survey.id != input.surveyId ||
      columnQuestion.survey.id != input.surveyId
    ) {
      throw new BadRequestException('集計対象が同一アンケートにありません');
    }

    if (rowQuestion.id == columnQuestion.id) {
      throw new BadRequestException('集計対象が二つとも同じ質問になっています');
    }

    if (
      rowQuestion.type === QuestionType.TEXT ||
      columnQuestion.type === QuestionType.TEXT
    ) {
      throw new BadRequestException('TEXT 型の質問はクロス集計の対象外です');
    }

    const result = await this.dataSource.query(
      `WITH 
      get_options AS(
      SELECT row_ao.option_id AS row_option_id,
      col_ao.option_id AS column_option_id, 
      COUNT(*) AS count 
      FROM submission s
      JOIN answer row_a ON row_a.submission_id = s.id AND row_a.question_id = ? 
      JOIN answer_options row_ao ON row_ao.answer_id = row_a.id 
      JOIN answer col_a ON col_a.submission_id = s.id AND col_a.question_id = ? 
      JOIN answer_options col_ao ON col_ao.answer_id = col_a.id
      WHERE s.survey_id = ? 
      GROUP BY row_ao.option_id, col_ao.option_id
      ), 
      cross_tab AS(
      SELECT r.id AS row_id, r.\`order\` AS row_order, c.id AS col_id, c.\`order\` AS col_order 
      FROM question_option r 
      CROSS JOIN question_option c 
      WHERE r.question_id = ? AND c.question_id = ?
      ),
      cells AS(
      SELECT ctab.row_id, ctab.col_id, ctab.row_order, ctab.col_order, COALESCE(gopt.count, 0) AS count
      FROM cross_tab ctab 
      LEFT JOIN get_options gopt ON gopt.row_option_id = ctab.row_id AND gopt.column_option_id = ctab.col_id
      ),
      cells_with_totals AS (
        SELECT 
          row_id, col_id,  row_order, col_order, count,
          SUM(count) OVER (PARTITION BY row_id) AS row_total,
          SUM(count) OVER (PARTITION BY col_id) AS col_total,
          SUM(count) OVER () AS grand_total
        FROM cells
      )
      SELECT 
        row_id, col_id, count,
        row_total, col_total, grand_total,
        CASE WHEN row_total = 0 THEN 0 
            ELSE count * 100.0 / row_total END AS row_percentage,
        CASE WHEN col_total = 0 THEN 0 
            ELSE count * 100.0 / col_total END AS column_percentage,
        CASE WHEN grand_total = 0 THEN 0 
            ELSE count * 100.0 / grand_total END AS total_percentage
      FROM cells_with_totals
      ORDER BY row_order, col_order
      `,
      [
        rowQuestion.id,
        columnQuestion.id,
        survey.id,
        rowQuestion.id,
        columnQuestion.id,
      ],
    );
    console.log(result);

    return {
      rowQuestion: {
        id: rowQuestion.id,
        qtext: rowQuestion.qtext,
        type: rowQuestion.type,
        options: rowQuestion.options
          .sort((a, b) => a.order - b.order)
          .map((o) => ({ id: o.id, text: o.text })),
      },
      columnQuestion: {
        id: columnQuestion.id,
        qtext: columnQuestion.qtext,
        type: columnQuestion.type,
        options: columnQuestion.options
          .sort((a, b) => a.order - b.order)
          .map((o) => ({ id: o.id, text: o.text })),
      },
      cells: [], // ← 後で実装
      rowSummary: [], // ← 後で実装
      columnSummary: [], // ← 後で実装
      grandTotal: 0, // ← 後で実装
    };
  }
}
