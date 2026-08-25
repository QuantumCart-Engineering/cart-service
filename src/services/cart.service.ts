import {
    AddCartItemDto
} from "../dtos/cart/add-cart-item.dto";

import {
    UpdateCartItemDto
} from "../dtos/cart/update-cart-item.dto";

import {
    AppError
} from "../utils/app-error";

import {
    getProductById
} from "../clients/product/product.client";

import {
    createCartRepository,
    findActiveCartByUserIdRepository,
    findCartWithItemsRepository,
    findCartItemRepository,
    createCartItemRepository,
    updateCartItemQuantityRepository,
    deleteCartItemRepository,
    deleteCartItemsRepository,
    CartWithItems
} from "../repositories/cart.repository";

/**
 * Get Active Cart
 *
 * Returns the user's active cart.
 * Creates one when the user does not have
 * an active cart.
 */
export const getOrCreateCartService =
    async (
        userId: string
    ): Promise<CartWithItems> => {
        let cart =
            await findActiveCartByUserIdRepository(
                userId
            );

        if (!cart) {
            cart =
                await createCartRepository(
                    userId
                );
        }

        const cartWithItems =
            await findCartWithItemsRepository(
                cart.id
            );

        if (!cartWithItems) {
            throw new Error(
                "Cart could not be retrieved"
            );
        }

        return cartWithItems;
    };

/**
 * Get Cart By ID
 *
 * The cart must belong to the
 * requested user.
 */
export const getCartByIdService =
    async (
        cartId: string,
        userId: string
    ): Promise<CartWithItems> => {
        const cart =
            await findCartWithItemsRepository(
                cartId
            );

        if (!cart) {
            throw new AppError(
                "Cart not found",
                404
            );
        }

        if (
            cart.user_id !== userId
        ) {
            throw new AppError(
                "Cart does not belong to this user",
                403
            );
        }

        return cart;
    };

/**
 * Add Item To Cart
 *
 * Product existence, active status and
 * current price are obtained from
 * Product Service.
 */
export const addCartItemService =
    async (
        cartId: string,
        userId: string,
        data: AddCartItemDto
    ) => {
        const cart =
            await getCartByIdService(
                cartId,
                userId
            );

        if (
            cart.status !== "ACTIVE"
        ) {
            throw new AppError(
                "Cannot modify an inactive cart",
                400
            );
        }

        /*
         * Validate product through
         * Product Service.
         */
        const product =
            await getProductById(
                data.productId
            );

        if (
            product.status !==
            "ACTIVE"
        ) {
            throw new AppError(
                "Product is inactive",
                400
            );
        }

        /*
         * Do not allow duplicate product
         * entries in the same cart.
         */
        const existingItem =
            await findCartItemRepository(
                cartId,
                data.productId
            );

        if (existingItem) {
            throw new AppError(
                "Product is already in the cart",
                409
            );
        }

        /*
         * Price comes from Product Service,
         * never from the client.
         */
        return createCartItemRepository(
            cartId,
            data.productId,
            data.quantity,
            product.price
        );
    };

/**
 * Update Cart Item Quantity
 */
export const updateCartItemService =
    async (
        cartId: string,
        userId: string,
        productId: string,
        data: UpdateCartItemDto
    ) => {
        const cart =
            await getCartByIdService(
                cartId,
                userId
            );

        if (
            cart.status !== "ACTIVE"
        ) {
            throw new AppError(
                "Cannot modify an inactive cart",
                400
            );
        }

        const existingItem =
            await findCartItemRepository(
                cartId,
                productId
            );

        if (!existingItem) {
            throw new AppError(
                "Cart item not found",
                404
            );
        }

        return updateCartItemQuantityRepository(
            cartId,
            productId,
            data.quantity
        );
    };

/**
 * Remove Cart Item
 */
export const removeCartItemService =
    async (
        cartId: string,
        userId: string,
        productId: string
    ) => {
        const cart =
            await getCartByIdService(
                cartId,
                userId
            );

        if (
            cart.status !== "ACTIVE"
        ) {
            throw new AppError(
                "Cannot modify an inactive cart",
                400
            );
        }

        const existingItem =
            await findCartItemRepository(
                cartId,
                productId
            );

        if (!existingItem) {
            throw new AppError(
                "Cart item not found",
                404
            );
        }

        await deleteCartItemRepository(
            cartId,
            productId
        );

        return {
            message:
                "Cart item removed successfully"
        };
    };

/**
 * Clear Cart
 */
export const clearCartService =
    async (
        cartId: string,
        userId: string
    ) => {
        const cart =
            await getCartByIdService(
                cartId,
                userId
            );

        if (
            cart.status !== "ACTIVE"
        ) {
            throw new AppError(
                "Cannot modify an inactive cart",
                400
            );
        }

        await deleteCartItemsRepository(
            cartId
        );

        return {
            message:
                "Cart cleared successfully"
        };
    };