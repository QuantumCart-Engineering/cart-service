CREATE TABLE cart_items (
    id CHAR(36) NOT NULL,
    cart_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,

    quantity INT UNSIGNED NOT NULL,

    unit_price DECIMAL(12,2) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_cart_items_cart_product (
        cart_id,
        product_id
    ),

    KEY idx_cart_items_cart (
        cart_id
    ),

    KEY idx_cart_items_product (
        product_id
    ),

    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id)
        REFERENCES carts(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_cart_items_quantity_positive
        CHECK (quantity > 0),

    CONSTRAINT chk_cart_items_unit_price_positive
        CHECK (unit_price > 0)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;