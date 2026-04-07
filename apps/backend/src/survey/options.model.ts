import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Question } from './question.model';

@ObjectType()
@Entity()
export class QuestionOption {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  text!: string; //テキスト

  @Field(() => Int)
  @Column( {default:0} )
  order!: Number;

  @Field(() => Question)
  @ManyToOne(() => Question, (q) => q.options)
  question!: Question;
}