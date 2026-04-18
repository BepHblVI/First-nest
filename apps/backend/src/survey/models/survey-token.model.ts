import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { Survey } from './survey.model';

@ObjectType()
@Entity()
export class SurveyToken {
  @Field()
  @PrimaryGeneratedColumn('uuid') // 推測不可能なUUIDをトークンとして使用
  token!: string;

  @Field()
  @Column({ default: false })
  isUsed!: boolean; // 使用済みフラグ

  // どのアンケートに対するトークンか
  @Field(() => Survey)
  @ManyToOne(() => Survey, (survey) => survey.tokens, { onDelete: 'CASCADE' })
  survey!: Survey;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @Column({ nullable: true })
  expiredAt?: Date; // 任意：有効期限を設ける場合
}
