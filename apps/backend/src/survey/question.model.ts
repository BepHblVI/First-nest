import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';
import { Survey } from './survey.model';

@ObjectType()
@Entity()
export class Question {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number; //設問ID

  @Field()
  @Column()
  qtext!: string; //設問テキスト

  @Field(() => Survey)
  @ManyToOne(() => Survey, (survey) => survey.questions)
  survey!: Survey; //親アンケート
}