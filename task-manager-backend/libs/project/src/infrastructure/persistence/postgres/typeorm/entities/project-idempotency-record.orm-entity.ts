import type { ProjectSnapshot } from '@project/domain';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ProjectOrmEntity } from './project.orm-entity';
import { PROJECT_IDEMPOTENCY_RECORD_TABLE_NAME } from '../../constants/project-idempotency-record-table.constants';

@Entity({ name: PROJECT_IDEMPOTENCY_RECORD_TABLE_NAME })
export class ProjectIdempotencyRecordOrmEntity {
  @PrimaryColumn({
    name: 'idempotency_key',
    type: 'varchar',
    length: 128,
  })
  idempotencyKey!: string;

  @Column({
    name: 'operation',
    type: 'varchar',
    length: 128,
  })
  operation!: string;

  @Index(`${PROJECT_IDEMPOTENCY_RECORD_TABLE_NAME}_aggregate_id`)
  @Column({
    name: 'aggregate_id',
    type: 'varchar',
    length: 64,
  })
  aggregateId!: string;

  @Column({
    name: 'response',
    type: 'jsonb',
  })
  response!: ProjectSnapshot;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @ManyToOne(() => ProjectOrmEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'aggregate_id',
    referencedColumnName: 'id',
    foreignKeyConstraintName: `${PROJECT_IDEMPOTENCY_RECORD_TABLE_NAME}_project_fk`,
  })
  project!: ProjectOrmEntity;
}
