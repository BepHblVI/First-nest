import { Field, ObjectType, Int } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Question } from './question.model';
import { Submission } from './submission.model';
import { QuestionOption } from './options.model';

@ObjectType({ description: '回答' })
@Entity()
export class Answer {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number; //回答ID

  @Field({ nullable: true })
  @Column({ nullable: true })
  text?: string; //回答テキスト

  @Field(() => [QuestionOption], {
    nullable: true,
    description: '選ばれた選択肢配列',
  })
  @ManyToMany(() => QuestionOption)
  @JoinTable()
  selectedOptions?: QuestionOption[];

  @Field(() => Question)
  @ManyToOne(() => Question, (question) => question.answers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  question!: Question; //親設問

  @Field(() => Submission)
  @ManyToOne(() => Submission, (sub) => sub.answers)
  submission!: Submission;
}
