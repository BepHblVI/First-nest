import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Question } from './question.model';
import { User } from '../../auth/user.model';
import { Submission } from './submission.model';
import { SurveyToken } from './survey-token.model';

/** アンケート回答時のアクセス制御方式 */
export enum SurveyAuthType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

registerEnumType(SurveyAuthType, {
  name: 'SurveyAuthType',
  description: 'アンケート回答時のアクセス制御方式',
  valuesMap: {
    PUBLIC: { description: '誰でもURLを知っていれば回答可能' },
    PRIVATE: { description: '発行された招待トークン保有者のみ回答可能' },
  },
});

/**
 * アンケート本体。設問・選択肢・回答送信・トークンの集約ルート。
 *
 * SECURITY:
 *   - `submissions` は @Field を付けない(回答内容の漏洩防止)。
 *     回答件数は `submissionCount` をResolveField経由で公開する。
 *   - `tokens` は所有者にのみ返す。eager: false にしているので、
 *     必要なクエリで明示的に relations: ['tokens'] を指定すること。
 */
@ObjectType({ description: 'アンケート本体(設問・回答送信・トークンの集約)' })
@Entity()
export class Survey {
  @Field(() => Int, { description: 'アンケートID(自動採番、内部用)' })
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String, {
    description: 'URL共有用の識別子(UUID。所有者以外でもこの値で参照可)',
  })
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 36, unique: true })
  @Generated('uuid')
  shareId!: string;

  @Field(() => String, { description: 'アンケートのタイトル' })
  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Field(() => User, { description: 'アンケートの作成者・所有者' })
  @ManyToOne(() => User, (owner) => owner.surveys, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @Index()
  owner!: User;

  @Field(() => [Question], {
    description: '設問の一覧(orderの昇順)',
  })
  @OneToMany(() => Question, (q) => q.survey, {
    // 親(Survey)の保存・削除と一緒に Question も伝播
    cascade: true,
    // Survey 取得時に Question も自動ロード(設問なしのSurveyは表示価値が低いため)
    eager: true,
    // edit時に Question を配列から外したものは DB から削除
    orphanedRowAction: 'delete',
  })
  questions!: Question[];

  @Field(() => Boolean, {
    description: '公開状態(true: 回答受付中 / false: 下書き、回答不可)',
  })
  @Column({ default: false })
  published!: boolean;

  @Field(() => SurveyAuthType, { description: 'アクセス制御方式' })
  @Column({
    type: 'enum',
    enum: SurveyAuthType,
    default: SurveyAuthType.PUBLIC,
  })
  auth!: SurveyAuthType;

  @Field(() => Date, { description: '作成日時' })
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @Field(() => Date, { description: '最終更新日時' })
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  /**
   * 受け取った回答送信の一覧。
   * GraphQL には公開しない(他者の回答漏洩を防ぐため)。
   * 件数だけ必要なら ResolveField の submissionCount を利用する。
   */
  @OneToMany(() => Submission, (sub) => sub.survey, { cascade: true })
  submissions!: Submission[];

  @Field(() => [SurveyToken], {
    description:
      '招待トークン一覧(PRIVATE時のみ。所有者にのみ返すこと。loadは明示ロードのみ)',
  })
  @OneToMany(() => SurveyToken, (token) => token.survey, {
    cascade: true,
    // eager: false に変更。所有者のクエリで明示的に relations 指定する。
    orphanedRowAction: 'delete',
  })
  tokens!: SurveyToken[];
}
