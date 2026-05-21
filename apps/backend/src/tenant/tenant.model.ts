import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
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

  // Phase 3-2 で Membership リレーション追加
  // Phase 3-5 で Survey リレーション追加
}
