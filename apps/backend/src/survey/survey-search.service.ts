import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Survey } from './models/survey.model';
import { SearchSurveyResult } from './dto/outputs';
import { User } from '../auth/user.model';
import { SearchSurveyInput } from './dto/inputs';
import {
  SurveySortField,
  SortOrder,
  SearchScope,
  PublishState,
  AnswerState,
} from './dto/enums';
import {
  FindOptionsOrder,
  FindOptionsWhere,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  Like,
  In,
  Repository,
} from 'typeorm';

@Injectable()
export class SurveySearchService {
  constructor(
    @InjectRepository(Survey) private surveyRepo: Repository<Survey>,
  ) {}

  async searchData(
    input: SearchSurveyInput,
    currentUser: User,
  ): Promise<SearchSurveyResult> {
    // ① 集約条件が必要なときだけ ID を絞り込む
    const aggregatedIds = await this.resolveAggregatedIds(input, currentUser);

    // 集約条件を指定したのに 0 件 → 早期リターン
    if (aggregatedIds !== null && aggregatedIds.length === 0) {
      return { items: [], totalCount: 0, hasNext: false };
    }

    // ② 通常の find 条件を構築
    const baseWhere = this.buildFilter(input, currentUser);
    const where = this.mergeIds(baseWhere, aggregatedIds);

    // ③ SUBMISSION_COUNT ソートだけ特別扱い
    const isAggSort = input.sortBy === SurveySortField.SUBMISSION_COUNT;

    const [items, totalCount] = isAggSort
      ? await this.findWithSubmissionCountSort(where, input)
      : await this.surveyRepo.findAndCount({
          where,
          order: this.buildOrder(input.sortBy, input.order),
          skip: input.offset,
          take: input.limit,
          relations: {
            owner: true,
            tokens: true,
            questions: {
              options: true,
            },
          },
        });

    const hasNext = input.offset + items.length < totalCount;
    return { items, totalCount, hasNext };
  }

  /**
   * 集約条件（answerStates / submissionCount）に該当する Survey の id を返す。
   * 集約条件がなければ null（= 絞り込み不要）。
   */
  private async resolveAggregatedIds(
    input: SearchSurveyInput,
    currentUser: User,
  ): Promise<number[] | null> {
    const needsAnswerState = input.answerStates?.length === 1;
    const needsCountRange =
      input.submissionCount?.min != null || input.submissionCount?.max != null;

    if (!needsAnswerState && !needsCountRange) {
      return null;
    }

    const qb = this.surveyRepo
      .createQueryBuilder('survey')
      .leftJoin('survey.submissions', 'sub')
      .select('survey.id', 'id')
      .where('survey.ownerId = :uid', { uid: currentUser.id })
      .groupBy('survey.id');

    if (needsAnswerState) {
      const state = input.answerStates![0];
      qb.having(
        state === AnswerState.UNANSWERED
          ? 'COUNT(sub.id) = 0'
          : 'COUNT(sub.id) > 0',
      );
    }
    if (input.submissionCount?.min != null) {
      qb.andHaving('COUNT(sub.id) >= :min', { min: input.submissionCount.min });
    }
    if (input.submissionCount?.max != null) {
      qb.andHaving('COUNT(sub.id) <= :max', { max: input.submissionCount.max });
    }

    const rows = await qb.getRawMany<{ id: number }>();
    return rows.map((r) => r.id);
  }

  /**
   * SUBMISSION_COUNT ソートのみ QueryBuilder で実施。
   */
  private async findWithSubmissionCountSort(
    where: FindOptionsWhere<Survey> | FindOptionsWhere<Survey>[],
    input: SearchSurveyInput,
  ): Promise<[Survey[], number]> {
    // find() の where を流用したいので、まず ID と件数を取る
    const [allMatched, totalCount] = await this.surveyRepo.findAndCount({
      where,
      select: { id: true } as any, // id だけ取得
    });
    if (totalCount === 0) return [[], 0];

    const ids = allMatched.map((s) => s.id);
    const dir = input.order === SortOrder.ASC ? 'ASC' : 'DESC';

    const items = await this.surveyRepo
      .createQueryBuilder('survey')
      .leftJoinAndSelect('survey.owner', 'owner')
      .leftJoinAndSelect('survey.tokens', 'tokens')
      .leftJoinAndSelect('survey.questions', 'questions')
      .leftJoinAndSelect('questions.options', 'options')
      .leftJoin('survey.submissions', 'sub')
      .where('survey.id IN (:...ids)', { ids })
      .groupBy('survey.id')
      .addGroupBy('owner.id')
      .addGroupBy('tokens.token')
      .addGroupBy('questions.id')
      .addGroupBy('options.id')
      .orderBy('COUNT(sub.id)', dir)
      .addOrderBy('survey.createdAt', 'DESC')
      .offset(input.offset)
      .limit(input.limit)
      .getMany();

    return [items, totalCount];
  }

  /**
   * baseWhere に「id IN (...)」を合成する。
   * baseWhere が配列（OR条件）なら各要素にマージする。
   */
  private mergeIds(
    baseWhere: FindOptionsWhere<Survey> | FindOptionsWhere<Survey>[],
    ids: number[] | null,
  ): FindOptionsWhere<Survey> | FindOptionsWhere<Survey>[] {
    if (ids === null) return baseWhere;
    const idCond = { id: In(ids) };

    return Array.isArray(baseWhere)
      ? baseWhere.map((w) => ({ ...w, ...idCond }))
      : { ...baseWhere, ...idCond };
  }

  private buildOrder(
    sortBy: SurveySortField,
    order: SortOrder,
  ): FindOptionsOrder<Survey> {
    const dir = order as 'ASC' | 'DESC';
    switch (sortBy) {
      case SurveySortField.TITLE:
        return { title: dir };
      case SurveySortField.UPDATED_AT:
        return { updatedAt: dir };
      case SurveySortField.CREATED_AT:
        return { createdAt: dir };
      case SurveySortField.SUBMISSION_COUNT:
        // find() では集約ソート不可。フォールバック or QueryBuilder へ
        return { createdAt: dir };
      default:
        return { createdAt: dir };
    }
  }

  private buildFilter(
    input: SearchSurveyInput,
    currentUser: User,
  ): FindOptionsWhere<Survey>[] | FindOptionsWhere<Survey> {
    const base: FindOptionsWhere<Survey> = {
      owner: { id: currentUser.id },
    };
    if (input.publishStates?.length === 1) {
      base.published = input.publishStates[0] === PublishState.PUBLISHED;
    }
    if (input.authTypes?.length === 1) {
      base.auth = input.authTypes[0];
    }
    const { from, to } = input.createdAt ?? {};
    if (from && to) {
      base.createdAt = Between(from, to);
    } else if (from) {
      base.createdAt = MoreThanOrEqual(from);
    } else if (to) {
      base.createdAt = LessThanOrEqual(to);
    }

    if (!input.keyword) {
      return base; // キーワードなしならここで終了
    }

    const pattern = Like(`%${this.escapeLikePattern(input.keyword)}%`);

    switch (input.scope) {
      case SearchScope.TITLE_ONLY:
        return { ...base, title: pattern };
      case SearchScope.TITLE_AND_QUESTIONS:
        return [
          { ...base, title: pattern },
          { ...base, questions: { qtext: pattern } },
        ];
      default:
        return base;
    }
  }
  private escapeLikePattern(s: string): string {
    return s.replace(/[%_\\]/g, (c) => `\\${c}`);
  }
}
