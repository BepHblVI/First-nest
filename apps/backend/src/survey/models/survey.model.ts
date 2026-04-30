import { Field, ObjectType, Int } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { registerEnumType } from '@nestjs/graphql';
import { Question } from './question.model';
import { User } from '../../auth/user.model';
import { Submission } from './submission.model';
import { SurveyToken } from './survey-token.model';

export enum SurveyAuthType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

registerEnumType(SurveyAuthType, {
  name: 'SurveyAuthType',
  description: 'アンケート回答時の認証方式',
  valuesMap: {
    PUBLIC: { description: '誰でも回答可能' },
    PRIVATE: { description: 'トークンが必要' },
  },
});

@ObjectType({ description: 'アンケート本体' })
@Entity()
export class Survey {
  @Field(() => Int, { description: 'アンケートID' })
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String, { description: 'アンケートURL識別子' })
  @Column({ unique: true })
  @Generated('uuid')
  shareId!: string;

  @Field({ description: 'アンケートタイトル' })
  @Column()
  title!: string;

  @Field(() => User, { description: 'アンケート作成者' })
  @ManyToOne(() => User, (owner) => owner.surveys, { nullable: false })
  owner!: User;

  @Field(() => [Question], { description: '設問' })
  @OneToMany(() => Question, (q) => q.survey, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  questions!: Question[];

  @Field({ description: 'アンケート公開状態' })
  @Column({ default: false })
  published!: boolean; //公開状態

  @Field(() => SurveyAuthType, { description: 'アンケートのセキュリティ' })
  @Column({
    type: 'enum',
    enum: SurveyAuthType,
    default: SurveyAuthType.PUBLIC,
  })
  auth!: SurveyAuthType;

  @Field({ description: 'アンケート作成日時' })
  @CreateDateColumn()
  createdAt!: Date;

  @Field({ description: 'アンケート更新日時' })
  @UpdateDateColumn()
  updatedAt!: Date;

  @Field(() => [Submission], { description: '提出一覧' })
  @OneToMany(() => Submission, (sub) => sub.survey, { cascade: true })
  submissions!: Submission[];

  @Field(() => [SurveyToken], {
    description: '回答用トークン（セキュリティ設定時のみ）',
  })
  @OneToMany(() => SurveyToken, (token) => token.survey, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  tokens!: SurveyToken[];
}
