// apps/backend/src/practice/practice.model.ts
import { Field, ObjectType, Int } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Comment } from './comment.model'; // 👈 インポートを追加

@ObjectType()
@Entity()
export class Practice {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  message!: string;

  // 👇 ここがリレーションの魔法（1対多の設定）
  @Field(() => [Comment], { nullable: true }) // GraphQL: 「複数のコメントを持つ（配列）」
  @OneToMany(() => Comment, (comment) => comment.practice) // TypeORMの設定
  comments!: Comment[];
}