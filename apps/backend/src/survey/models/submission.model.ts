import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Survey } from './survey.model';
import { Answer } from './answer.model';

/**
 * 1回分のアンケート回答送信。
 * 1人の回答者が1回送信すると1つのSubmissionが作られ、
 * その配下に各設問への Answer が紐付く。
 *
 * NOTE: `answers` リレーションはDB操作専用。
 *       回答内容は集計済みの SurveyResult 経由でのみ外部に公開する。
 */
@ObjectType({ description: 'アンケートへの1回分の回答送信' })
@Entity()
export class Submission {
  @Field(() => Int, { description: '送信ID(自動採番)' })
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => Date, { description: '送信日時' })
  @CreateDateColumn({ type: 'timestamp' })
  submittedAt!: Date;

  @Field(() => Survey, { description: '回答対象のアンケート' })
  @ManyToOne(() => Survey, (survey) => survey.submissions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @Index()
  survey!: Survey;

  /**
   * この送信に含まれる、各設問への回答。
   * GraphQL には公開しない(他者の回答漏洩を防ぐため)。
   * 集計値は SurveyResult 経由で所有者にのみ提供する。
   */
  @OneToMany(() => Answer, (ans) => ans.submission, {
    cascade: true,
  })
  answers!: Answer[];

  @Field(() => String, {
    nullable: true,
    description: '回答者を識別する任意のID(クライアント発行、匿名集計用)',
  })
  @Column({ type: 'varchar', length: 100, nullable: true })
  respondentId?: string;
}
