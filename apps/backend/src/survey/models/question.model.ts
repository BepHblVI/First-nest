import { Field, ObjectType, Int } from '@nestjs/graphql';
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

@ObjectType()
@Entity()
export class Question {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number; //設問ID

  @Field()
  @Column({ default: 'TEXT' })
  type!: string; //設問タイプ

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
