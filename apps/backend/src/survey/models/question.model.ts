import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Survey } from './survey.model';
import { Answer } from './answer.model';
import { QuestionOption } from './options.model';

/** 質問の形式 */
export enum QuestionType {
  TEXT = 'TEXT',
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE',
}

registerEnumType(QuestionType, {
  name: 'QuestionType',
  description: '質問の形式',
  valuesMap: {
    TEXT: { description: 'テキスト入力(自由記述)' },
    SINGLE: { description: '単一選択(選択肢から1つだけ)' },
    MULTIPLE: { description: '複数選択(選択肢から複数選択可)' },
  },
});

/**
 * アンケートの設問。Survey に1対多で紐付く。
 * 表示順は `order`(0始まり)で制御する。
 *
 * NOTE: `answers` リレーションはDB操作専用。
 *       回答内容は集計済みの SurveyResult 経由でのみ外部に公開する。
 */
@ObjectType({ description: 'アンケートの設問' })
@Entity()
@Index(['survey', 'order'])
export class Question {
  @Field(() => Int, { description: '設問ID(自動採番)' })
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Int, {
    description: '同一アンケート内での表示順(0始まり、昇順)',
  })
  @Column({ type: 'int' })
  order!: number;

  @Field(() => String, { description: '設問のテキスト(本文)' })
  @Column({ type: 'varchar', length: 500 })
  qtext!: string;

  @Field(() => QuestionType, { description: '設問の形式' })
  @Column({ type: 'enum', enum: QuestionType })
  type!: QuestionType;

  @Field(() => Boolean, { description: '回答必須フラグ' })
  @Column({ default: false })
  required!: boolean;

  @Field(() => [QuestionOption], {
    description: '選択肢(SINGLE/MULTIPLEのときのみ要素を持つ。orderの昇順)',
  })
  @OneToMany(() => QuestionOption, (option) => option.question, {
    // 親(Question)の保存・削除と一緒に Option も伝播させる
    cascade: true,
    // Question 取得時に Option も自動でロード(設問表示には常に必要なため)
    eager: true,
    // edit時に Option を配列から外したものは DB から削除する
    orphanedRowAction: 'delete',
  })
  options!: QuestionOption[];

  @Field(() => Survey, { description: 'この設問が属するアンケート' })
  @ManyToOne(() => Survey, (survey) => survey.questions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  survey!: Survey;

  /**
   * この設問への回答群。
   * GraphQL には公開しない(他者の回答漏洩を防ぐため)。
   * 集計値は SurveyResult 経由で所有者にのみ提供する。
   */
  @OneToMany(() => Answer, (ans) => ans.question, {
    cascade: true,
  })
  answers!: Answer[];
}
