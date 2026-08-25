import {
    createHash
} from "crypto";

import fs from "fs";

import {
    calculateMigrationChecksum,
    loadMigrationFiles,
    baselineMissingMigrationChecksums,
    validateMigrationHistory,
    acquireMigrationLock,
    releaseMigrationLock,
    executeMigration,
    MigrationFile,
    RecordedMigration
} from "../../../scripts/migration.utils";

jest.mock("fs");

const mockedFs =
    fs as jest.Mocked<typeof fs>;

describe("Migration Utils", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe(
        "calculateMigrationChecksum",
        () => {
            it(
                "should calculate SHA-256 checksum",
                () => {
                    const sql =
                        "CREATE TABLE users (id INT);";

                    const expected =
                        createHash("sha256")
                            .update(sql)
                            .digest("hex");

                    expect(
                        calculateMigrationChecksum(
                            sql
                        )
                    ).toBe(expected);
                }
            );

            it(
                "should return different checksums for different SQL",
                () => {
                    const first =
                        calculateMigrationChecksum(
                            "CREATE TABLE users;"
                        );

                    const second =
                        calculateMigrationChecksum(
                            "CREATE TABLE products;"
                        );

                    expect(
                        first
                    ).not.toBe(second);
                }
            );
        }
    );

    describe(
        "loadMigrationFiles",
        () => {
            it(
                "should load SQL migration files in sorted order",
                () => {
                    mockedFs.readdirSync.mockReturnValue(
                        [
                            "002_second.sql",
                            "001_first.sql",
                            "README.md",
                            "003_third.txt"
                        ] as unknown as ReturnType<
                            typeof fs.readdirSync
                        >
                    );

                    mockedFs.readFileSync
                        .mockImplementation(
                            (
                                filePath
                            ) => {
                                if (
                                    String(
                                        filePath
                                    ).includes(
                                        "001_first.sql"
                                    )
                                ) {
                                    return "CREATE TABLE first;";
                                }

                                if (
                                    String(
                                        filePath
                                    ).includes(
                                        "002_second.sql"
                                    )
                                ) {
                                    return "CREATE TABLE second;";
                                }

                                return "";
                            }
                        );

                    const result =
                        loadMigrationFiles(
                            "/migrations"
                        );

                    expect(
                        result
                    ).toHaveLength(2);

                    expect(
                        result[0].name
                    ).toBe(
                        "001_first.sql"
                    );

                    expect(
                        result[0].sql
                    ).toBe(
                        "CREATE TABLE first;"
                    );

                    expect(
                        result[0].checksum
                    ).toBe(
                        calculateMigrationChecksum(
                            "CREATE TABLE first;"
                        )
                    );

                    expect(
                        result[1].name
                    ).toBe(
                        "002_second.sql"
                    );
                }
            );

            it(
                "should trim migration SQL",
                () => {
                    mockedFs.readdirSync.mockReturnValue(
                        [
                            "001_first.sql"
                        ] as unknown as ReturnType<
                            typeof fs.readdirSync
                        >
                    );

                    mockedFs.readFileSync.mockReturnValue(
                        "  CREATE TABLE first;  \n"
                    );

                    const result =
                        loadMigrationFiles(
                            "/migrations"
                        );

                    expect(
                        result[0].sql
                    ).toBe(
                        "CREATE TABLE first;"
                    );
                }
            );

            it(
                "should throw when a migration is empty",
                () => {
                    mockedFs.readdirSync.mockReturnValue(
                        [
                            "001_empty.sql"
                        ] as unknown as ReturnType<
                            typeof fs.readdirSync
                        >
                    );

                    mockedFs.readFileSync.mockReturnValue(
                        "   "
                    );

                    expect(
                        () =>
                            loadMigrationFiles(
                                "/migrations"
                            )
                    ).toThrow(
                        'Migration "001_empty.sql" is empty.'
                    );
                }
            );

            it(
                "should ignore non-SQL files",
                () => {
                    mockedFs.readdirSync.mockReturnValue(
                        [
                            "001_first.sql",
                            "README.md",
                            "notes.txt"
                        ] as unknown as ReturnType<
                            typeof fs.readdirSync
                        >
                    );

                    mockedFs.readFileSync.mockReturnValue(
                        "CREATE TABLE first;"
                    );

                    const result =
                        loadMigrationFiles(
                            "/migrations"
                        );

                    expect(
                        result
                    ).toHaveLength(1);

                    expect(
                        result[0].name
                    ).toBe(
                        "001_first.sql"
                    );
                }
            );
        }
    );

    describe(
        "baselineMissingMigrationChecksums",
        () => {
            it(
                "should baseline migrations with missing checksums",
                async () => {
                    const migration: MigrationFile =
                        {
                            name:
                                "001_create_users.sql",

                            sql:
                                "CREATE TABLE users;",

                            checksum:
                                "checksum-001"
                        };

                    const connection = {
                        execute:
                            jest.fn()
                                .mockResolvedValue([
                                    [],
                                    undefined
                                ])
                    };

                    const recorded: RecordedMigration[] =
                        [
                            {
                                migration_name:
                                    "001_create_users.sql",

                                checksum:
                                    null
                            }
                        ];

                    await baselineMissingMigrationChecksums(
                        connection,
                        [migration],
                        recorded
                    );

                    expect(
                        connection.execute
                    ).toHaveBeenCalledWith(
                        expect.stringContaining(
                            "UPDATE schema_migrations"
                        ),
                        [
                            "checksum-001",
                            "001_create_users.sql"
                        ]
                    );
                }
            );

            it(
                "should skip migrations that already have checksums",
                async () => {
                    const connection = {
                        execute:
                            jest.fn()
                    };

                    const recorded: RecordedMigration[] =
                        [
                            {
                                migration_name:
                                    "001_create_users.sql",

                                checksum:
                                    "existing-checksum"
                            }
                        ];

                    await baselineMissingMigrationChecksums(
                        connection,
                        [],
                        recorded
                    );

                    expect(
                        connection.execute
                    ).not.toHaveBeenCalled();
                }
            );

            it(
                "should throw when recorded migration is missing",
                async () => {
                    const connection = {
                        execute:
                            jest.fn()
                    };

                    const recorded: RecordedMigration[] =
                        [
                            {
                                migration_name:
                                    "001_missing.sql",

                                checksum:
                                    null
                            }
                        ];

                    await expect(
                        baselineMissingMigrationChecksums(
                            connection,
                            [],
                            recorded
                        )
                    ).rejects.toThrow(
                        'Migration history is inconsistent: recorded migration "001_missing.sql" is missing from the migrations directory.'
                    );
                }
            );
        }
    );

    describe(
        "validateMigrationHistory",
        () => {
            const migration: MigrationFile =
                {
                    name:
                        "001_create_users.sql",

                    sql:
                        "CREATE TABLE users;",

                    checksum:
                        "checksum-001"
                };

            it(
                "should accept matching migration history",
                () => {
                    const recorded: RecordedMigration[] =
                        [
                            {
                                migration_name:
                                    "001_create_users.sql",

                                checksum:
                                    "checksum-001"
                            }
                        ];

                    expect(
                        () =>
                            validateMigrationHistory(
                                [migration],
                                recorded
                            )
                    ).not.toThrow();
                }
            );

            it(
                "should throw when recorded migration is missing",
                () => {
                    const recorded: RecordedMigration[] =
                        [
                            {
                                migration_name:
                                    "002_missing.sql",

                                checksum:
                                    "checksum-002"
                            }
                        ];

                    expect(
                        () =>
                            validateMigrationHistory(
                                [migration],
                                recorded
                            )
                    ).toThrow(
                        'Migration history is inconsistent: recorded migration "002_missing.sql" is missing from the migrations directory.'
                    );
                }
            );

            it(
                "should throw when checksum is missing",
                () => {
                    const recorded: RecordedMigration[] =
                        [
                            {
                                migration_name:
                                    "001_create_users.sql",

                                checksum:
                                    null
                            }
                        ];

                    expect(
                        () =>
                            validateMigrationHistory(
                                [migration],
                                recorded
                            )
                    ).toThrow(
                        'Migration checksum is missing for recorded migration "001_create_users.sql". Baseline its checksum before running migrations.'
                    );
                }
            );

            it(
                "should throw when checksum does not match",
                () => {
                    const recorded: RecordedMigration[] =
                        [
                            {
                                migration_name:
                                    "001_create_users.sql",

                                checksum:
                                    "wrong-checksum"
                            }
                        ];

                    expect(
                        () =>
                            validateMigrationHistory(
                                [migration],
                                recorded
                            )
                    ).toThrow(
                        'Migration modified: checksum mismatch for "001_create_users.sql".'
                    );
                }
            );
        }
    );

    describe(
        "acquireMigrationLock",
        () => {
            it(
                "should acquire the migration lock",
                async () => {
                    const connection = {
                        execute:
                            jest.fn()
                                .mockResolvedValue([
                                    [
                                        {
                                            lock_acquired:
                                                1
                                        }
                                    ],
                                    undefined
                                ])
                    };

                    await expect(
                        acquireMigrationLock(
                            connection,
                            "test-lock",
                            30
                        )
                    ).resolves.toBeUndefined();

                    expect(
                        connection.execute
                    ).toHaveBeenCalledWith(
                        "SELECT GET_LOCK(?, ?) AS lock_acquired",
                        [
                            "test-lock",
                            30
                        ]
                    );
                }
            );

            it(
                "should throw when lock cannot be acquired",
                async () => {
                    const connection = {
                        execute:
                            jest.fn()
                                .mockResolvedValue([
                                    [
                                        {
                                            lock_acquired:
                                                0
                                        }
                                    ],
                                    undefined
                                ])
                    };

                    await expect(
                        acquireMigrationLock(
                            connection,
                            "test-lock",
                            30
                        )
                    ).rejects.toThrow(
                        'Could not acquire migration lock "test-lock".'
                    );
                }
            );

            it(
                "should throw when lock result is null",
                async () => {
                    const connection = {
                        execute:
                            jest.fn()
                                .mockResolvedValue([
                                    [],
                                    undefined
                                ])
                    };

                    await expect(
                        acquireMigrationLock(
                            connection,
                            "test-lock",
                            30
                        )
                    ).rejects.toThrow(
                        'Could not acquire migration lock "test-lock".'
                    );
                }
            );
        }
    );

    describe(
        "releaseMigrationLock",
        () => {
            it(
                "should release the migration lock",
                async () => {
                    const connection = {
                        execute:
                            jest.fn()
                                .mockResolvedValue([
                                    [],
                                    undefined
                                ])
                    };

                    await releaseMigrationLock(
                        connection,
                        "test-lock"
                    );

                    expect(
                        connection.execute
                    ).toHaveBeenCalledWith(
                        "SELECT RELEASE_LOCK(?)",
                        ["test-lock"]
                    );
                }
            );
        }
    );

    describe(
        "executeMigration",
        () => {
            const migration: MigrationFile =
                {
                    name:
                        "001_create_users.sql",

                    sql:
                        "CREATE TABLE users;",

                    checksum:
                        "checksum-001"
                };

            it(
                "should execute migration and record it",
                async () => {
                    const connection = {
                        beginTransaction:
                            jest.fn()
                                .mockResolvedValue(
                                    undefined
                                ),

                        query:
                            jest.fn()
                                .mockResolvedValue(
                                    []
                                ),

                        execute:
                            jest.fn()
                                .mockResolvedValue(
                                    []
                                ),

                        commit:
                            jest.fn()
                                .mockResolvedValue(
                                    undefined
                                ),

                        rollback:
                            jest.fn()
                                .mockResolvedValue(
                                    undefined
                                )
                    };

                    await executeMigration(
                        connection,
                        migration
                    );

                    expect(
                        connection.beginTransaction
                    ).toHaveBeenCalledTimes(1);

                    expect(
                        connection.query
                    ).toHaveBeenCalledWith(
                        migration.sql
                    );

                    expect(
                        connection.execute
                    ).toHaveBeenCalledWith(
                        expect.stringContaining(
                            "INSERT INTO schema_migrations"
                        ),
                        [
                            migration.name,
                            migration.checksum
                        ]
                    );

                    expect(
                        connection.commit
                    ).toHaveBeenCalledTimes(1);

                    expect(
                        connection.rollback
                    ).not.toHaveBeenCalled();
                }
            );

            it(
                "should rollback when migration fails",
                async () => {
                    const error =
                        new Error(
                            "Migration failed"
                        );

                    const connection = {
                        beginTransaction:
                            jest.fn()
                                .mockResolvedValue(
                                    undefined
                                ),

                        query:
                            jest.fn()
                                .mockRejectedValue(
                                    error
                                ),

                        execute:
                            jest.fn()
                                .mockResolvedValue(
                                    []
                                ),

                        commit:
                            jest.fn()
                                .mockResolvedValue(
                                    undefined
                                ),

                        rollback:
                            jest.fn()
                                .mockResolvedValue(
                                    undefined
                                )
                    };

                    await expect(
                        executeMigration(
                            connection,
                            migration
                        )
                    ).rejects.toThrow(
                        "Migration failed"
                    );

                    expect(
                        connection.beginTransaction
                    ).toHaveBeenCalledTimes(1);

                    expect(
                        connection.rollback
                    ).toHaveBeenCalledTimes(1);

                    expect(
                        connection.commit
                    ).not.toHaveBeenCalled();
                }
            );

            it(
                "should rollback when recording migration fails",
                async () => {
                    const error =
                        new Error(
                            "Insert failed"
                        );

                    const connection = {
                        beginTransaction:
                            jest.fn()
                                .mockResolvedValue(
                                    undefined
                                ),

                        query:
                            jest.fn()
                                .mockResolvedValue(
                                    []
                                ),

                        execute:
                            jest.fn()
                                .mockRejectedValue(
                                    error
                                ),

                        commit:
                            jest.fn()
                                .mockResolvedValue(
                                    undefined
                                ),

                        rollback:
                            jest.fn()
                                .mockResolvedValue(
                                    undefined
                                )
                    };

                    await expect(
                        executeMigration(
                            connection,
                            migration
                        )
                    ).rejects.toThrow(
                        "Insert failed"
                    );

                    expect(
                        connection.rollback
                    ).toHaveBeenCalledTimes(1);

                    expect(
                        connection.commit
                    ).not.toHaveBeenCalled();
                }
            );
        }
    );
});