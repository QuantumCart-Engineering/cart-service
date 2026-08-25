import {
    Request,
    Response
} from "express";

import {
    getOrCreateCartService,
    getCartByIdService,
    addCartItemService,
    updateCartItemService,
    removeCartItemService,
    clearCartService
} from "../services/cart.service";

import {
    validateAddCartItem
} from "../validators/cart/add-cart-item.validator";

import {
    validateUpdateCartItem
} from "../validators/cart/update-cart-item.validator";

import {
    AppError
} from "../utils/app-error";

/**
 * Get required user ID from request header.
 *
 * Temporary authentication mechanism.
 *
 * Later this will be replaced by
 * Identity Service authentication middleware.
 */
const getUserId = (
    req: Request
): string => {
    const userId =
        req.header("x-user-id");

    if (
        !userId ||
        !userId.trim()
    ) {
        throw new AppError(
            "User ID is required",
            401
        );
    }

    return userId.trim();
};

/**
 * Get required route parameter.
 */
const getRouteParam = (
    value:
        | string
        | string[]
        | undefined,
    paramName: string
): string => {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        throw new AppError(
            `${paramName} is required`,
            400
        );
    }

    return value.trim();
};

/**
 * Get active cart.
 *
 * GET /api/v1/cart
 */
export const getCartController =
    async (
        req: Request,
        res: Response
    ) => {
        const userId =
            getUserId(req);

        const cart =
            await getOrCreateCartService(
                userId
            );

        return res
            .status(200)
            .json({
                success: true,
                data: cart
            });
    };

/**
 * Get cart by ID.
 *
 * GET /api/v1/cart/:cartId
 */
export const getCartByIdController =
    async (
        req: Request,
        res: Response
    ) => {
        const userId =
            getUserId(req);

        const cartId =
            getRouteParam(
                req.params.cartId,
                "Cart ID"
            );

        const cart =
            await getCartByIdService(
                cartId,
                userId
            );

        return res
            .status(200)
            .json({
                success: true,
                data: cart
            });
    };

/**
 * Add product to cart.
 *
 * POST /api/v1/cart/:cartId/items
 */
export const addCartItemController =
    async (
        req: Request,
        res: Response
    ) => {
        const userId =
            getUserId(req);

        const cartId =
            getRouteParam(
                req.params.cartId,
                "Cart ID"
            );

        validateAddCartItem(
            req.body
        );

        const item =
            await addCartItemService(
                cartId,
                userId,
                req.body
            );

        return res
            .status(201)
            .json({
                success: true,
                message:
                    "Cart item added successfully",
                data: item
            });
    };

/**
 * Update cart item quantity.
 *
 * PUT /api/v1/cart/:cartId/items/:productId
 */
export const updateCartItemController =
    async (
        req: Request,
        res: Response
    ) => {
        const userId =
            getUserId(req);

        const cartId =
            getRouteParam(
                req.params.cartId,
                "Cart ID"
            );

        const productId =
            getRouteParam(
                req.params.productId,
                "Product ID"
            );

        validateUpdateCartItem(
            req.body
        );

        const item =
            await updateCartItemService(
                cartId,
                userId,
                productId,
                req.body
            );

        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Cart item updated successfully",
                data: item
            });
    };

/**
 * Remove cart item.
 *
 * DELETE /api/v1/cart/:cartId/items/:productId
 */
export const removeCartItemController =
    async (
        req: Request,
        res: Response
    ) => {
        const userId =
            getUserId(req);

        const cartId =
            getRouteParam(
                req.params.cartId,
                "Cart ID"
            );

        const productId =
            getRouteParam(
                req.params.productId,
                "Product ID"
            );

        const result =
            await removeCartItemService(
                cartId,
                userId,
                productId
            );

        return res
            .status(200)
            .json({
                success: true,
                ...result
            });
    };

/**
 * Clear cart.
 *
 * DELETE /api/v1/cart/:cartId/items
 */
export const clearCartController =
    async (
        req: Request,
        res: Response
    ) => {
        const userId =
            getUserId(req);

        const cartId =
            getRouteParam(
                req.params.cartId,
                "Cart ID"
            );

        const result =
            await clearCartService(
                cartId,
                userId
            );

        return res
            .status(200)
            .json({
                success: true,
                ...result
            });
    };