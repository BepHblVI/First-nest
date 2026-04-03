// apps/backend/src/practice/practice.model.ts
import { Field, ObjectType, Int } from '@nestjs/graphql';

@ObjectType()
export class Practice {
  @Field(() => Int)
  id: number;

  @Field()
  message: string;
}