import { SurveyAuthType } from '../models/survey.model';
import { QuestionType } from '../models/question.model';
import { buildTokenEntities, mapQuestionInputs } from './survey-mapper';

describe('buildTokenEntities', () => {
  it('PUBLIC のときは空配列', () => {
    expect(buildTokenEntities(SurveyAuthType.PUBLIC, 5)).toEqual([]);
  });

  it('PRIVATE でも tokens が 0 なら空配列', () => {
    expect(buildTokenEntities(SurveyAuthType.PRIVATE, 0)).toEqual([]);
  });

  it('PRIVATE で tokens > 0 なら指定数の空オブジェクト', () => {
    expect(buildTokenEntities(SurveyAuthType.PRIVATE, 3)).toEqual([{}, {}, {}]);
  });

  it('PRIVATE で tokens が負数なら空配列', () => {
    expect(buildTokenEntities(SurveyAuthType.PRIVATE, -1)).toEqual([]);
  });
});

describe('mapQuestionInputs', () => {
  it('options が undefined のときは空配列', () => {
    const result = mapQuestionInputs([
      { qtext: 'テスト', type: QuestionType.TEXT, required: false },
    ]);
    expect(result[0].options).toEqual([]);
  });

  it('options に order が index で付与される', () => {
    const result = mapQuestionInputs([
      {
        qtext: '色',
        type: QuestionType.SINGLE,
        required: true,
        options: ['赤', '青', '緑'],
      },
    ]);
    expect(result[0].options).toEqual([
      { text: '赤', order: 0 },
      { text: '青', order: 1 },
      { text: '緑', order: 2 },
    ]);
  });
});
