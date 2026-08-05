import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

const TABLE_NAME = 'tasks';
const TASK_STATUS_ENUM_NAME = 'task_status';
const TASK_PRIORITY_ENUM_NAME = 'task_priority';

export class CreateTasksTable1785945150861 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE_NAME,
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '64',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'project_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enumName: TASK_STATUS_ENUM_NAME,
            enum: ['pending', 'in-progress', 'completed'],
            isNullable: false,
            default: "'pending'",
          },
          {
            name: 'priority',
            type: 'enum',
            enumName: TASK_PRIORITY_ENUM_NAME,
            enum: ['low', 'medium', 'high'],
            isNullable: false,
            default: "'medium'",
          },
          {
            name: 'due_date',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            name: `${TABLE_NAME}_project_fk`,
            columnNames: ['project_id'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      TABLE_NAME,
      new TableIndex({
        name: `${TABLE_NAME}_project_status_priority_idx`,
        columnNames: ['project_id', 'status', 'priority'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
    await queryRunner.query(`DROP TYPE "${TASK_PRIORITY_ENUM_NAME}"`);
    await queryRunner.query(`DROP TYPE "${TASK_STATUS_ENUM_NAME}"`);
  }
}
