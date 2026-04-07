import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Question } from './question.model';
import { Submission } from './submission.model';
import { QuestionOption } from './options.model';

@ObjectType()
@Entity()
export class Answer {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number; //回答ID

  @Field({nullable:true})
  @Column({nullable:true})
  text?: string; //回答テキスト

  @Field(() => [QuestionOption], { nullable: true })
  @ManyToMany(() => QuestionOption)
  @JoinTable() // 👈 これをつけるだけで、裏側で中間テーブルを自動作成してくれます
  selectedOptions?: QuestionOption[];

  @Field(() => Question)
  @ManyToOne(() => Question, (question) => question.answers)
  question!: Question; //親設問

  @Field(() => Submission)
  @ManyToOne(() => Submission, (sub) => sub.answers)
  submission!: Submission;

}