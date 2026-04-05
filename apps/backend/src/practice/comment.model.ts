// apps/backend/src/practice/comment.model.ts
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Practice } from './practice.model';

@ObjectType()
@Entity()
export class Comment {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  text!: string;

  // 👇 ここがリレーションの魔法（多対1の設定）
  @Field(() => Practice) // GraphQL: 「このコメントは、どのPracticeに属しているか」
  @ManyToOne(() => Practice, (practice) => practice.comments) // TypeORMの設定
  practice!: Practice;
}