import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Survey } from '../models/survey.model';
import { Question } from '../models/question.model';
import { User } from '../../auth/models/user.model';
import { CrossTabulationInput } from '../dto/inputs';
import {
  CrossTabulationResult,
  CrossTabCell,
  AxisSummary,
} from '../dto/outputs';
import { QuestionType } from '../models/question.model';

interface CrossTab {
  row_id: number;
  col_id: number;
  count: string;
  row_total: string;
  col_total: string;
  grand_total: string;
  row_percentage: string;
  column_percentage: string;
  total_percentage: string;
}

@Injectable()
export class CrossResultService {
  constructor(
    @InjectRepository(Survey) private surveyRepo: Repository<Survey>,
    @InjectRepository(Question) private questionRepo: Repository<Question>,
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
    const [rowQ, columnQ] = await Promise.all([
      this.questionRepo.findOne({
        where: { id: input.rowQuestionId },
        relations: { options: true, survey: true },
      }),
      this.questionRepo.findOne({
        where: { id: input.columnQuestionId },
        relations: { options: true, survey: true },
      }),
    ]);
    if (!rowQ || !columnQ)
      throw new NotFoundException('集計する質問が見つかりません');

    if (
      rowQ.survey.id !== input.surveyId ||
      columnQ.survey.id !== input.surveyId
    ) {
      throw new BadRequestException('集計対象が同一アンケートにありません');
    }

    if (rowQ.id === columnQ.id) {
      throw new BadRequestException('集計対象が二つとも同じ質問になっています');
    }

    if (rowQ.type === QuestionType.TEXT || columnQ.type === QuestionType.TEXT) {
      throw new BadRequestException('TEXT 型の質問はクロス集計の対象外です');
    }

    const result: CrossTab[] = await this.fetchCrossTabData(
      rowQ.id,
      columnQ.id,
      survey.id,
    );

    const cells: CrossTabCell[] = result.map((row) => ({
      rowOptionId: row.row_id,
      columnOptionId: row.col_id,
      count: Number(row.count),
      rowPercentage: Number(row.row_percentage),
      columnPercentage: Number(row.column_percentage),
      totalPercentage: Number(row.total_percentage),
    }));

    const grandTotal = Number(result[0]?.grand_total ?? 0);

    // 行/列の合計を Map に保存（DBが計算済みなのでただ取り出すだけ）
    const rowTotalsMap = new Map<number, number>();
    const colTotalsMap = new Map<number, number>();
    for (const row of result) {
      rowTotalsMap.set(row.row_id, Number(row.row_total));
      colTotalsMap.set(row.col_id, Number(row.col_total));
    }

    // サマリ作成
    const rowSummary: AxisSummary[] = rowQ.options.map((opt) => {
      const count = rowTotalsMap.get(opt.id) ?? 0;
      return {
        optionId: opt.id,
        count,
        percentage: grandTotal === 0 ? 0 : (count / grandTotal) * 100,
      };
    });

    const columnSummary: AxisSummary[] = columnQ.options.map((opt) => {
      const count = colTotalsMap.get(opt.id) ?? 0;
      return {
        optionId: opt.id,
        count,
        percentage: grandTotal === 0 ? 0 : (count / grandTotal) * 100,
      };
    });

    const rowQuestion = {
      id: rowQ.id,
      qtext: rowQ.qtext,
      type: rowQ.type,
      options: rowQ.options
        .sort((a, b) => a.order - b.order)
        .map((o) => ({ id: o.id, text: o.text })),
    };

    const columnQuestion = {
      id: columnQ.id,
      qtext: columnQ.qtext,
      type: columnQ.type,
      options: columnQ.options
        .sort((a, b) => a.order - b.order)
        .map((o) => ({ id: o.id, text: o.text })),
    };

    return {
      rowQuestion,
      columnQuestion,
      cells,
      rowSummary,
      columnSummary,
      grandTotal,
    };
  }
  private async fetchCrossTabData(
    rowId: number,
    columnId: number,
    surveyId: number,
  ): Promise<CrossTab[]> {
    return this.dataSource.query(
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
      [rowId, columnId, surveyId, rowId, columnId],
    );
  }
}
