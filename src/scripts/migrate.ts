import mysql from "mysql2/promise";
import path from "path";

import {
    RowDataPacket
} from "mysql2";

import { env } from "../config/env";

import {
    acquireMigrationLock,
    baselineMissingMigrationChecksums,
    executeMigration,
    loadMigrationFiles,
    releaseMigrationLock,
    validateMigrationHistory
} from "./migration.utils";

interface MigrationRow
    extends RowDataPacket {
    migration_name: string;
    checksum: string | null;
}

interface ColumnRow
    extends RowDataPacket {
    COLUMN_NAME: string;
}

const migrationLockName =
    `cart-service:migrations:${env.db.name}`;

const createDatabase = async () => {
    const connection =
        await mysql.createConnection({
            host: env.db.host,
            port: env.db.port,
            user: env.dbRoot.user,
            password: env.dbRoot.password
        });

    try {
        await connection.query(`
            CREATE DATABASE IF NOT EXISTS \`${env.db.name}\`
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
        `);

        console.log(
            `Database "${env.db.name}" is ready.`
        );
    } finally {
        await connection.end();
    }
};

const createMigrationTable = async (
    pool: mysql.Pool
) => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            migration_name VARCHAR(255) NOT NULL,
            checksum CHAR(64) NOT NULL,
            executed_at TIMESTAMP NOT NULL
                DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uk_schema_migrations_name (
                migration_name
            )
        )
    `);

    const [checksumColumns] =
        await pool.execute<ColumnRow[]>(
            `
                SELECT COLUMN_NAME
                FROM information_schema.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'schema_migrations'
                  AND COLUMN_NAME = 'checksum'
            `
        );

    if (
        checksumColumns.length === 0
    ) {
        await pool.query(`
            ALTER TABLE schema_migrations
            ADD COLUMN checksum CHAR(64) NULL
                AFTER migration_name
        `);
    }
};

const getRecordedMigrations =
    async (
        pool: mysql.Pool
    ) => {
        const [rows] =
            await pool.execute<
                MigrationRow[]
            >(
                `
                    SELECT
                        migration_name,
                        checksum
                    FROM schema_migrations
                    ORDER BY migration_name ASC
                `
            );

        return rows;
    };

const runMigrations = async () => {
    const pool =
        mysql.createPool({
            host: env.db.host,
            port: env.db.port,
            user: env.db.user,
            password: env.db.password,
            database: env.db.name,

            waitForConnections: true,

            connectionLimit: 5,

            queueLimit: 0
        });

    const migrationsDirectory =
        path.resolve(
            process.cwd(),
            "migrations"
        );

    let lockConnection:
        | mysql.PoolConnection
        | undefined;

    let lockAcquired = false;

    try {
        lockConnection =
            await pool.getConnection();

        await acquireMigrationLock(
            lockConnection,
            migrationLockName,
            30
        );

        lockAcquired = true;

        await createMigrationTable(
            pool
        );

        const migrations =
            loadMigrationFiles(
                migrationsDirectory
            );

        let recordedMigrations =
            await getRecordedMigrations(
                pool
            );

        await baselineMissingMigrationChecksums(
            pool,
            migrations,
            recordedMigrations
        );

        recordedMigrations =
            await getRecordedMigrations(
                pool
            );

        validateMigrationHistory(
            migrations,
            recordedMigrations
        );

        const recordedNames =
            new Set(
                recordedMigrations.map(
                    (migration) =>
                        migration.migration_name
                )
            );

        for (
            const migration of migrations
        ) {
            if (
                recordedNames.has(
                    migration.name
                )
            ) {
                console.log(
                    `Skipping already executed migration: ${migration.name}`
                );

                continue;
            }

            console.log(
                `Running migration: ${migration.name}`
            );

            const connection =
                await pool.getConnection();

            try {
                await executeMigration(
                    connection,
                    migration
                );
            } finally {
                connection.release();
            }

            console.log(
                `Completed migration: ${migration.name}`
            );
        }

        console.log(
            "All migrations completed successfully."
        );
    } finally {
        if (lockConnection) {
            try {
                if (lockAcquired) {
                    await releaseMigrationLock(
                        lockConnection,
                        migrationLockName
                    );
                }
            } finally {
                lockConnection.release();
            }
        }

        await pool.end();
    }
};

const migrate = async () => {
    try {
        console.log(
            "Starting database migration..."
        );

        await createDatabase();

        await runMigrations();

        console.log(
            "Database migration completed successfully."
        );
    } catch (error) {
        console.error(
            "Database migration failed:",
            error
        );

        process.exitCode = 1;
    }
};

migrate();