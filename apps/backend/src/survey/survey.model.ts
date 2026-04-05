import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Question } from './question.model';

@ObjectType()
@Entity()
export class Survey {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number; //アンケートID

  @Field()
  @Column()
  title!: string; //アンケートタイトル

  @Field()
  @Column()
  owner!: string; //作成者（仮で文字列にしている）

  @Field(() => [Question])
  @OneToMany(() => Question, (q) => q.survey, {cascade:true})
  questions!: Question[]; //設問群
}