import { Field, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Survey } from './survey.model';
import { Answer } from './answer.model';
import { QuestionOption } from './options.model';

export enum QuestionType {
  TEXT = 'TEXT',
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE',
}

registerEnumType(QuestionType, {
  name: 'QuestionType',
  description: '質問の形式',
  valuesMap: {
    TEXT: { description: 'テキスト入力' },
    SINGLE: { description: '単一選択' },
    MULTIPLE: { description: '複数選択' },
  },
});

@ObjectType({ description: 'アンケート設問' })
@Entity()
export class Question {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number; //設問ID

  @Field(() => QuestionType) // ★ Field の型を QuestionType に
  @Column({
    type: 'enum',
    enum: QuestionType,
  })
  type!: QuestionType;

  @Field()
  @Column({ default: false })
  required!: boolean;

  @Field()
  @Column()
  qtext!: string; //設問テキスト

  @Field(() => [QuestionOption])
  @OneToMany(() => QuestionOption, (option) => option.question, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  options?: QuestionOption[]; //選択肢

  @Field(() => Survey)
  @ManyToOne(() => Survey, (survey) => survey.questions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  survey!: Survey; //親アンケート

  @Field(() => [Answer])
  @OneToMany(() => Answer, (ans) => ans.question, { cascade: true })
  answers!: Answer[]; //回答
}
