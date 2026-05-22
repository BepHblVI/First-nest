import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Membership } from './membership.model';
@Entity()
export class Tenant {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 63, unique: true })
  slug!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => Membership, (membership) => membership.tenant)
  memberships!: Membership[];
  // Phase 3-5 で Survey リレーション追加
}
