import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Field, ObjectType } from '@nestjs/graphql';
import { Survey } from './survey.model';

/**
 * PRIVATEアンケート用の招待トークン。
 *
 * SECURITY:
 *   `token` フィールドは「回答するための鍵」そのもの。
 *   所有者(発行者)以外には絶対に返してはならない。
 *   Survey.tokens リレーションを取得する経路では、
 *   呼び出し元で必ず所有者チェックを行うこと。
 */
@ObjectType({ description: 'PRIVATEアンケートへの回答を許可する招待トークン' })
@Entity()
export class SurveyToken {
  @Field(() => String, {
    description:
      '回答用トークン値(UUID)。所有者にのみ公開すること。1回使うと無効になる',
  })
  @PrimaryGeneratedColumn('uuid')
  token!: string;

  @Field(() => Boolean, { description: '使用済みフラグ(trueは消費済み)' })
  @Index()
  @Column({ default: false })
  isUsed!: boolean;

  @Field(() => Survey, { description: 'このトークンが対象とするアンケート' })
  @ManyToOne(() => Survey, (survey) => survey.tokens, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @Index()
  survey!: Survey;

  @Field(() => Date, { description: 'トークン発行日時' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
