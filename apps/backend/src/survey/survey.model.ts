import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, Generated, CreateDateColumn } from 'typeorm';
import { Question } from './question.model';
import { User } from '../auth/user.model';
import { Submission } from './submission.model';

@ObjectType()
@Entity()
export class Survey {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number; //アンケートID

  @Field(() => String)
  @Column({ unique: true })
  @Generated('uuid')
  shareId!: string;

  @Field()
  @Column()
  title!: string; //アンケートタイトル

  @Field(() => User)
  @ManyToOne(() => User, (owner) => owner.surveys)
  owner!: User; //作成者

  @Field(() => [Question])
  @OneToMany(() => Question, (q) => q.survey, {cascade:true})
  questions!: Question[]; //設問群

  @Field()
  @Column( {default: false})
  published!: boolean;

  @Field()
  @CreateDateColumn()
  created_at!: Date;

  @Field(() => [Submission])
  @OneToMany(() => Submission, (sub) => sub.survey, {cascade:true})
  submissions!: Submission[];
}