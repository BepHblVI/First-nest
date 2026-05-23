import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Survey } from '../../models/survey.model';

@ObjectType({ description: 'アンケート検索結果(ページング情報付き)' })
export class SearchSurveyResult {
  @Field(() => [Survey], {
    description: '検索ヒットしたアンケート(現在のページ分)',
  })
  items!: Survey[];

  @Field(() => Int, { description: '条件にマッチした総件数(ページング前)' })
  totalCount!: number;

  @Field(() => Boolean, { description: '次のページがあるか' })
  hasNext!: boolean;
}
