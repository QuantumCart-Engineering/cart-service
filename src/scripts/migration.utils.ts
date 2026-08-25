import {
    createHash
} from "crypto";

import fs from "fs";
import path from "path";

import type {
    PoolConnection
} from "mysql2/promise";

import type {
    RowDataPacket
} from "mysql2";

export interface MigrationFile {
    name: string;
    sql: string;
    checksum: string;
}

export interface RecordedMigration {
    migration_name: string;
    checksum: string | null;
}

type QueryConnection = Pick<
    PoolConnection,
    "execute"
>;

type TransactionConnection = Pick<
    PoolConnection,
    | "execute"
    | "beginTransaction"
    | "query"
    | "commit"
    | "rollback"
>;

interface LockRow extends RowDataPacket {
    lock_acquired: number | null;
}

export const calculateMigrationChecksum = (
    sql: string
): string =>
    createHash("sha256")
        .update(sql)
        .digest("hex");

export const loadMigrationFiles = (
    migrationsDirectory: string
): MigrationFile[] =>
    fs.readdirSync(migrationsDirectory)
        .filter(
            (file) => file.endsWith(".sql")
        )
        .sort()
        .map((name) => {
            const sql = fs.readFileSync(
                path.join(
                    migrationsDirectory,
                    name
                ),
                "utf-8"
            ).trim();

            if (!sql) {
                throw new Error(
                    `Migration "${name}" is empty.`
                );
            }

            return {
                name,
                sql,
                checksum:
                    calculateMigrationChecksum(sql)
            };
        });

export const baselineMissingMigrationChecksums =
    async (
        connection: QueryConnection,
        migrations: MigrationFile[],
        recordedMigrations: RecordedMigration[]
    ) => {
        const migrationByName =
            new Map(
                migrations.map(
                    (migration) => [
                        migration.name,
                        migration
                    ]
                )
            );

        for (
            const recorded of recordedMigrations
        ) {
            if (
                recorded.checksum !== null
            ) {
                continue;
            }

            const migration =
                migrationByName.get(
                    recorded.migration_name
                );

            if (!migration) {
                throw new Error(
                    `Migration history is inconsistent: recorded migration "${recorded.migration_name}" is missing from the migrations directory.`
                );
            }

            await connection.execute(
                `
                    UPDATE schema_migrations
                    SET checksum = ?
                    WHERE migration_name = ?
                      AND checksum IS NULL
                `,
                [
                    migration.checksum,
                    migration.name
                ]
            );

            console.log(
                `Baselined checksum for existing migration: ${migration.name}`
            );
        }
    };

export const validateMigrationHistory = (
    migrations: MigrationFile[],
    recordedMigrations: RecordedMigration[]
) => {
    const migrationByName =
        new Map(
            migrations.map(
                (migration) => [
                    migration.name,
                    migration
                ]
            )
        );

    for (
        const recorded of recordedMigrations
    ) {
        const migration =
            migrationByName.get(
                recorded.migration_name
            );

        if (!migration) {
            throw new Error(
                `Migration history is inconsistent: recorded migration "${recorded.migration_name}" is missing from the migrations directory.`
            );
        }

        if (!recorded.checksum) {
            throw new Error(
                `Migration checksum is missing for recorded migration "${recorded.migration_name}". Baseline its checksum before running migrations.`
            );
        }

        if (
            recorded.checksum !==
            migration.checksum
        ) {
            throw new Error(
                `Migration modified: checksum mismatch for "${recorded.migration_name}".`
            );
        }
    }
};

export const acquireMigrationLock = async (
    connection: QueryConnection,
    lockName: string,
    timeoutSeconds: number
) => {
    const [rows] =
        await connection.execute<LockRow[]>(
            "SELECT GET_LOCK(?, ?) AS lock_acquired",
            [
                lockName,
                timeoutSeconds
            ]
        );

    if (
        rows[0]?.lock_acquired !== 1
    ) {
        throw new Error(
            `Could not acquire migration lock "${lockName}".`
        );
    }
};

export const releaseMigrationLock = async (
    connection: QueryConnection,
    lockName: string
) => {
    await connection.execute(
        "SELECT RELEASE_LOCK(?)",
        [lockName]
    );
};

export const executeMigration = async (
    connection: TransactionConnection,
    migration: MigrationFile
) => {
    await connection.beginTransaction();

    try {
        await connection.query(
            migration.sql
        );

        await connection.execute(
            `
                INSERT INTO schema_migrations (
                    migration_name,
                    checksum
                )
                VALUES (?, ?)
            `,
            [
                migration.name,
                migration.checksum
            ]
        );

        await connection.commit();
    } catch (error) {
        await connection.rollback();

        throw error;
    }
};