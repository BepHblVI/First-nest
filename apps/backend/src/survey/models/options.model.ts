import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Question } from './question.model';

/**
 * 選択式質問(SINGLE/MULTIPLE)で使う選択肢。
 * 1つの Question に対して複数の Option がぶら下がる。
 * 表示順は `order`(0始まり)で制御する。
 */
@ObjectType({ description: '選択式質問の1つの選択肢' })
@Entity()
@Index(['question', 'order'])
export class QuestionOption {
  @Field(() => Int, { description: '選択肢ID(自動採番)' })
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String, { description: '選択肢の表示テキスト' })
  @Column({ type: 'varchar', length: 200 })
  text!: string;

  @Field(() => Int, { description: '同一質問内での表示順(0始まり、昇順)' })
  @Column({ type: 'int' })
  order!: number;

  @Field(() => Question, { description: 'この選択肢が属する設問' })
  @ManyToOne(() => Question, (q) => q.options, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  question!: Question;
}
