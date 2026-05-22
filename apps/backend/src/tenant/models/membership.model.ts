import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/models/user.model';
import { Tenant } from './tenant.model';
import { Role } from '../constants/enums';

/**
 * User と Tenant の中間テーブル。
 *
 * 1ユーザーが複数テナントに所属でき、テナントごとに異なるロールを持つ。
 * UNIQUE 制約により、同じ (user, tenant) の組は1つだけ存在する。
 *
 * GraphQL:
 *   Phase 3-2 では Entity のみ。Resolver は後の Phase で。
 */
@Entity()
@Unique(['user', 'tenant'])
export class Membership {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, (user) => user.memberships, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  user!: User;

  @ManyToOne(() => Tenant, (tenant) => tenant.memberships, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  tenant!: Tenant;

  @Column({ type: 'enum', enum: Role })
  role!: Role;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}
