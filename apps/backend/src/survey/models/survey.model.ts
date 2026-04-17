import { Field, ObjectType, Int } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  Generated,
  CreateDateColumn,
} from 'typeorm';
import { Question } from './question.model';
import { User } from '../../auth/user.model';
import { Submission } from './submission.model';
import { SurveyToken } from './survey-token.model';

@ObjectType()
@Entity()
export class Survey {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number; //アンケートID

  @Field(() => String)
  @Column({ unique: true })
  @Generated('uuid')
  shareId!: string; //URL用の識別子

  @Field()
  @Column()
  title!: string; //アンケートタイトル

  @Field(() => User)
  @ManyToOne(() => User, (owner) => owner.surveys)
  owner!: User; //作成者

  @Field(() => [Question])
  @OneToMany(() => Question, (q) => q.survey, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  questions!: Question[]; //設問群

  @Field()
  @Column({ default: false })
  published!: boolean; //公開状態

  @Field()
  @Column({ default: false })
  auth!: string; //回答時にユーザー認証するかどうか

  @Field()
  @CreateDateColumn()
  created_at!: Date;

  @Field(() => [Submission])
  @OneToMany(() => Submission, (sub) => sub.survey, { cascade: true })
  submissions!: Submission[];

  @OneToMany(() => SurveyToken, (token) => token.survey, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  tokens!: SurveyToken[];
}
