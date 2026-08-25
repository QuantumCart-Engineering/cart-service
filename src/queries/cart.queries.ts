export const createCartQuery = `
    INSERT INTO carts (
        id,
        user_id,
        status
    )
    VALUES (?, ?, 'ACTIVE')
`;

export const findActiveCartByUserIdQuery = `
    SELECT
        id,
        user_id,
        status,
        created_at,
        updated_at
    FROM carts
    WHERE user_id = ?
      AND status = 'ACTIVE'
    LIMIT 1
`;

export const findCartByIdQuery = `
    SELECT
        id,
        user_id,
        status,
        created_at,
        updated_at
    FROM carts
    WHERE id = ?
    LIMIT 1
`;

export const findCartItemsQuery = `
    SELECT
        id,
        cart_id,
        product_id,
        quantity,
        unit_price,
        created_at,
        updated_at
    FROM cart_items
    WHERE cart_id = ?
    ORDER BY created_at ASC, id ASC
`;

export const findCartItemQuery = `
    SELECT
        id,
        cart_id,
        product_id,
        quantity,
        unit_price,
        created_at,
        updated_at
    FROM cart_items
    WHERE cart_id = ?
      AND product_id = ?
    LIMIT 1
`;

export const createCartItemQuery = `
    INSERT INTO cart_items (
        id,
        cart_id,
        product_id,
        quantity,
        unit_price
    )
    VALUES (?, ?, ?, ?, ?)
`;

export const updateCartItemQuantityQuery = `
    UPDATE cart_items
    SET
        quantity = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE cart_id = ?
      AND product_id = ?
`;

export const deleteCartItemQuery = `
    DELETE FROM cart_items
    WHERE cart_id = ?
      AND product_id = ?
`;

export const deleteCartItemsQuery = `
    DELETE FROM cart_items
    WHERE cart_id = ?
`;

export const updateCartStatusQuery = `
    UPDATE carts
    SET
        status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
`;