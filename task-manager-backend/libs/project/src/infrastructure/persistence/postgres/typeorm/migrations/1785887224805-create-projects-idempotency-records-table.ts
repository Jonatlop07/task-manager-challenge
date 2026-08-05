import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

const TABLE_NAME = 'project_idempotency_records';

export class CreateProjectsIdempotencyRecordsTable1785887224805 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE_NAME,
        columns: [
          {
            name: 'idempotency_key',
            type: 'varchar',
            length: '128',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'operation',
            type: 'varchar',
            length: '128',
            isNullable: false,
          },
          {
            name: 'aggregate_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'response',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          {
            name: `${TABLE_NAME}_project_fk`,
            columnNames: ['aggregate_id'],
            referencedTableName: 'projects',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      TABLE_NAME,
      new TableIndex({
        name: `${TABLE_NAME}_aggregate_id_idx`,
        columnNames: ['aggregate_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME, true);
  }
}
