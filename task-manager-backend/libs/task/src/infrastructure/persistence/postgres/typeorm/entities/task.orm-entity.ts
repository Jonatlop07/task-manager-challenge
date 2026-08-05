import { TaskPriority, TaskStatus } from '@task/domain';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  TASK_PRIORITY_ENUM_NAME,
  TASK_STATUS_ENUM_NAME,
  TASK_TABLE_NAME,
} from '../../constants';

@Entity({ name: TASK_TABLE_NAME })
@Index(`${TASK_TABLE_NAME}_project_status_priority_idx`, [
  'projectId',
  'status',
  'priority',
])
export class TaskOrmEntity {
  @PrimaryColumn({
    name: 'id',
    type: 'varchar',
    length: 64,
  })
  id!: string;

  @Column({
    name: 'project_id',
    type: 'varchar',
    length: 64,
  })
  projectId!: string;

  @Column({
    name: 'title',
    type: 'varchar',
    length: 150,
  })
  title!: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description!: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enumName: TASK_STATUS_ENUM_NAME,
    enum: TaskStatus,
    default: TaskStatus.Pending,
  })
  status!: TaskStatus;

  @Column({
    name: 'priority',
    type: 'enum',
    enumName: TASK_PRIORITY_ENUM_NAME,
    enum: TaskPriority,
    default: TaskPriority.Medium,
  })
  priority!: TaskPriority;

  @Column({
    name: 'due_date',
    type: 'timestamptz',
    nullable: true,
  })
  dueDate!: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;
}
