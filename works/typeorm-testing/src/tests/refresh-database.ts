import { DataSource, EntityManager } from 'typeorm';
import { TestingDataSource } from './data-source';

let connection: DataSource;

export const refreshDatabase = async (test: (_conn: EntityManager) => Promise<unknown>) => {
    if (!connection) {
        throw new Error('Connection must be initialized!');
    }
    const qb = await connection.createQueryRunner();
    await qb.startTransaction();
    await test(qb.manager);
    await qb.rollbackTransaction();
    await qb.release();
}

export const initConnection = async () => {
    connection = await TestingDataSource.initialize();
    await cleanTables(connection);
    const migrations = connection.migrations;
    migrations.forEach(async (_) => {
        await connection.undoLastMigration();
    });
    connection.runMigrations();
};

export const destroyConnection = async () => {
    connection.destroy();
}

const cleanTables = async (connection: DataSource) => {
    const queryRunner = connection.createQueryRunner();
    const truncates = connection.entityMetadatas.map(async (metadata) => {
        await queryRunner.query(`TRUNCATE TABLE \"${metadata.tableName}\"`);
    })

    return Promise.all(truncates);
}