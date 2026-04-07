import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
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
  submitted_at!: Date;

  @Field(() => Survey)
  @ManyToOne(() => Survey, (survey) => survey.submissions)
  survey!: Survey;

  @Field(() => [Answer])
  @OneToMany(() => Answer, (ans) => ans.submission,{ cascade: true })
  answers!: Answer[];
}