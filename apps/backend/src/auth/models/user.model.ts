import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Survey } from '../../survey/models/survey.model';
import { RefreshToken } from './refresh-token.model';
import { Membership } from '../../tenant/models/membership.model';

@Entity()
@ObjectType()
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  username!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  displayName?: string | null;

  @Column()
  password!: string;

  @Field(() => [Survey])
  @OneToMany(() => Survey, (survey) => survey.owner)
  surveys!: Survey[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @OneToMany(() => Membership, (membership) => membership.user)
  memberships!: Membership[];
}
