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
  @ManyToOne(() => User, (owner) => owner.surveys, { nullable: false })
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

  @Field(() => SurveyAuthType)
  @Column({
    type: 'enum',
    enum: SurveyAuthType,
    default: SurveyAuthType.PUBLIC,
  })
  auth!: SurveyAuthType;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt!: Date;

  @Field(() => [Submission])
  @OneToMany(() => Submission, (sub) => sub.survey, { cascade: true })
  submissions!: Submission[];

  @Field(() => [SurveyToken])
  @OneToMany(() => SurveyToken, (token) => token.survey, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  tokens!: SurveyToken[];
}
