CREATE TABLE carts (
    id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    status ENUM(
        'ACTIVE',
        'CHECKED_OUT',
        'ABANDONED'
    ) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_carts_user_status (
        user_id,
        status
    ),

    KEY idx_carts_created_id (
        created_at,
        id
    )
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;