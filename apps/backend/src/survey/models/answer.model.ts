import { Field, ObjectType, Int } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question.model';
import { Submission } from './submission.model';
import { QuestionOption } from './options.model';

/**
 * アンケートの1問に対する回答。
 * - TEXT 質問: `text` に自由記述が入り、`selectedOptions` は空
 * - SINGLE/MULTIPLE 質問: `selectedOptions` に選択された選択肢が入り、`text` は null
 *
 * 上記の整合性は AnswerValidator で保証する(DBスキーマ上の制約ではない)。
 */
@ObjectType({ description: 'アンケートの設問1問に対する回答' })
@Entity()
export class Answer {
  @Field(() => Int, { description: '回答ID(自動採番)' })
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String, {
    nullable: true,
    description: '自由記述の回答テキスト(TEXT質問のときのみ存在)',
  })
  @Column({ type: 'text', nullable: true })
  text?: string;

  @Field(() => [QuestionOption], {
    description: '選択された選択肢の配列(選択式質問のときのみ要素を持つ)',
  })
  @ManyToMany(() => QuestionOption)
  @JoinTable({
    name: 'answer_selected_options',
    joinColumn: { name: 'answer_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'option_id', referencedColumnName: 'id' },
  })
  selectedOptions!: QuestionOption[];

  @Field(() => Question, { description: 'この回答が属する設問' })
  @ManyToOne(() => Question, (question) => question.answers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @Index()
  question!: Question;

  @Field(() => Submission, {
    description: 'この回答が含まれる回答セット(送信単位)',
  })
  @ManyToOne(() => Submission, (submission) => submission.answers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @Index()
  submission!: Submission;

  @Field(() => Date, { description: '回答が作成された日時' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
