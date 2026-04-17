import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Survey } from './survey.model';

@Entity()
export class SurveyToken {
  @PrimaryGeneratedColumn('uuid') // 推測不可能なUUIDをトークンとして使用
  token!: string;

  @Column({ default: false })
  isUsed!: boolean; // 使用済みフラグ

  // どのアンケートに対するトークンか
  @ManyToOne(() => Survey, (survey) => survey.tokens, { onDelete: 'CASCADE' })
  survey!: Survey;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  expiredAt?: Date; // 任意：有効期限を設ける場合
}
