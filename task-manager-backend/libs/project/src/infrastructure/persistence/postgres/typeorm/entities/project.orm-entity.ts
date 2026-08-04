import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PROJECT_TABLE_NAME } from '../../constants/project-table.constants';

@Entity({ name: PROJECT_TABLE_NAME })
export class ProjectOrmEntity {
  @PrimaryColumn({
    name: 'id',
    type: 'varchar',
    length: 64,
  })
  id!: string;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 256,
  })
  name!: string;

  @Column({
    name: 'description',
    type: 'text',
    nullable: true,
  })
  description!: string | null;

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
