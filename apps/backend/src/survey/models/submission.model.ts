import { Field, ObjectType, Int } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Column,
} from 'typeorm';
import { Survey } from './survey.model';
import { Answer } from './answer.model';

@ObjectType()
@Entity()
export class Submission {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @CreateDateColumn()
  submittedAt!: Date;

  @Field(() => Survey)
  @ManyToOne(() => Survey, (survey) => survey.submissions, { nullable: false })
  survey!: Survey;

  @Field(() => [Answer])
  @OneToMany(() => Answer, (ans) => ans.submission, { cascade: true })
  answers!: Answer[];

  @Field({ nullable: true })
  @Column({ nullable: true })
  respondentId?: string;
}
