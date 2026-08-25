import {
    ResultSetHeader,
    RowDataPacket
} from "mysql2";

import {
    randomUUID
} from "crypto";

import pool from "../config/database";

import {
    createCartQuery,
    findActiveCartByUserIdQuery,
    findCartByIdQuery,
    findCartItemsQuery,
    findCartItemQuery,
    createCartItemQuery,
    updateCartItemQuantityQuery,
    deleteCartItemQuery,
    deleteCartItemsQuery,
    updateCartStatusQuery
} from "../queries/cart.queries";

export interface CartRecord {
    id: string;
    user_id: string;
    status:
        | "ACTIVE"
        | "CHECKED_OUT"
        | "ABANDONED";
    created_at: Date;
    updated_at: Date;
}

export interface CartRow
    extends RowDataPacket,
        CartRecord {}

export interface CartItemRecord {
    id: string;
    cart_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    created_at: Date;
    updated_at: Date;
}

export interface CartItemRow
    extends RowDataPacket,
        CartItemRecord {}

export interface CartWithItems
    extends CartRecord {
    items: CartItemRecord[];
}

/**
 * Create Cart
 */
export const createCartRepository =
    async (
        userId: string
    ): Promise<CartRecord> => {
        const cartId =
            randomUUID();

        await pool.execute(
            createCartQuery,
            [
                cartId,
                userId
            ]
        );

        const cart =
            await findCartByIdRepository(
                cartId
            );

        if (!cart) {
            throw new Error(
                "Cart was created but could not be retrieved"
            );
        }

        return cart;
    };

/**
 * Find Active Cart By User ID
 */
export const findActiveCartByUserIdRepository =
    async (
        userId: string
    ): Promise<CartRecord | null> => {
        const [rows] =
            await pool.query<CartRow[]>(
                findActiveCartByUserIdQuery,
                [userId]
            );

        if (
            rows.length === 0
        ) {
            return null;
        }

        const cart =
            rows[0];

        return {
            id: cart.id,
            user_id: cart.user_id,
            status: cart.status,
            created_at:
                cart.created_at,
            updated_at:
                cart.updated_at
        };
    };

/**
 * Find Cart By ID
 */
export const findCartByIdRepository =
    async (
        cartId: string
    ): Promise<CartRecord | null> => {
        const [rows] =
            await pool.query<CartRow[]>(
                findCartByIdQuery,
                [cartId]
            );

        if (
            rows.length === 0
        ) {
            return null;
        }

        const cart =
            rows[0];

        return {
            id: cart.id,
            user_id: cart.user_id,
            status: cart.status,
            created_at:
                cart.created_at,
            updated_at:
                cart.updated_at
        };
    };

/**
 * Get Cart Items
 */
export const findCartItemsRepository =
    async (
        cartId: string
    ): Promise<CartItemRecord[]> => {
        const [rows] =
            await pool.query<
                CartItemRow[]
            >(
                findCartItemsQuery,
                [cartId]
            );

        return rows.map(
            (item) => ({
                id: item.id,
                cart_id:
                    item.cart_id,
                product_id:
                    item.product_id,
                quantity:
                    item.quantity,
                unit_price:
                    Number(
                        item.unit_price
                    ),
                created_at:
                    item.created_at,
                updated_at:
                    item.updated_at
            })
        );
    };

/**
 * Get Cart With Items
 */
export const findCartWithItemsRepository =
    async (
        cartId: string
    ): Promise<CartWithItems | null> => {
        const cart =
            await findCartByIdRepository(
                cartId
            );

        if (!cart) {
            return null;
        }

        const items =
            await findCartItemsRepository(
                cartId
            );

        return {
            ...cart,
            items
        };
    };

/**
 * Find Cart Item
 */
export const findCartItemRepository =
    async (
        cartId: string,
        productId: string
    ): Promise<CartItemRecord | null> => {
        const [rows] =
            await pool.query<
                CartItemRow[]
            >(
                findCartItemQuery,
                [
                    cartId,
                    productId
                ]
            );

        if (
            rows.length === 0
        ) {
            return null;
        }

        const item =
            rows[0];

        return {
            id: item.id,
            cart_id:
                item.cart_id,
            product_id:
                item.product_id,
            quantity:
                item.quantity,
            unit_price:
                Number(
                    item.unit_price
                ),
            created_at:
                item.created_at,
            updated_at:
                item.updated_at
        };
    };

/**
 * Add Cart Item
 */
export const createCartItemRepository =
    async (
        cartId: string,
        productId: string,
        quantity: number,
        unitPrice: number
    ): Promise<CartItemRecord> => {
        const itemId =
            randomUUID();

        await pool.execute(
            createCartItemQuery,
            [
                itemId,
                cartId,
                productId,
                quantity,
                unitPrice
            ]
        );

        const item =
            await findCartItemRepository(
                cartId,
                productId
            );

        if (!item) {
            throw new Error(
                "Cart item was created but could not be retrieved"
            );
        }

        return item;
    };

/**
 * Update Cart Item Quantity
 */
export const updateCartItemQuantityRepository =
    async (
        cartId: string,
        productId: string,
        quantity: number
    ): Promise<CartItemRecord> => {
        const [result] =
            await pool.execute<
                ResultSetHeader
            >(
                updateCartItemQuantityQuery,
                [
                    quantity,
                    cartId,
                    productId
                ]
            );

        if (
            result.affectedRows === 0
        ) {
            throw new Error(
                "Cart item could not be updated"
            );
        }

        const item =
            await findCartItemRepository(
                cartId,
                productId
            );

        if (!item) {
            throw new Error(
                "Cart item was updated but could not be retrieved"
            );
        }

        return item;
    };

/**
 * Delete Cart Item
 */
export const deleteCartItemRepository =
    async (
        cartId: string,
        productId: string
    ): Promise<void> => {
        await pool.execute<
            ResultSetHeader
        >(
            deleteCartItemQuery,
            [
                cartId,
                productId
            ]
        );
    };

/**
 * Clear Cart
 */
export const deleteCartItemsRepository =
    async (
        cartId: string
    ): Promise<void> => {
        await pool.execute<
            ResultSetHeader
        >(
            deleteCartItemsQuery,
            [cartId]
        );
    };

/**
 * Update Cart Status
 */
export const updateCartStatusRepository =
    async (
        cartId: string,
        status:
            | "ACTIVE"
            | "CHECKED_OUT"
            | "ABANDONED"
    ): Promise<CartRecord> => {
        const [result] =
            await pool.execute<
                ResultSetHeader
            >(
                updateCartStatusQuery,
                [
                    status,
                    cartId
                ]
            );

        if (
            result.affectedRows === 0
        ) {
            throw new Error(
                "Cart status could not be updated"
            );
        }

        const cart =
            await findCartByIdRepository(
                cartId
            );

        if (!cart) {
            throw new Error(
                "Cart was updated but could not be retrieved"
            );
        }

        return cart;
    };