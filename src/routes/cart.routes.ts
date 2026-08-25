import {
    Router
} from "express";

import {
    getCartController,
    getCartByIdController,
    addCartItemController,
    updateCartItemController,
    removeCartItemController,
    clearCartController
} from "../controllers/cart.controller";

const router =
    Router();

/**
 * @swagger
 * /api/v1/cart:
 *   get:
 *     summary: Get the user's active cart
 *     tags: [Cart]
 *     parameters:
 *       - name: x-user-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *         description: Temporary user identifier. Will be replaced by authentication middleware.
 *     responses:
 *       200:
 *         description: Cart fetched successfully
 *       401:
 *         description: User ID is required
 */
router.get(
    "/",
    getCartController
);

/**
 * @swagger
 * /api/v1/cart/{cartId}:
 *   get:
 *     summary: Get cart by ID
 *     tags: [Cart]
 *     parameters:
 *       - name: cartId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: x-user-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart fetched successfully
 *       401:
 *         description: User ID is required
 *       403:
 *         description: Cart does not belong to the user
 *       404:
 *         description: Cart not found
 */
router.get(
    "/:cartId",
    getCartByIdController
);

/**
 * @swagger
 * /api/v1/cart/{cartId}/items:
 *   post:
 *     summary: Add a product to cart
 *     tags: [Cart]
 *     parameters:
 *       - name: cartId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: x-user-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       201:
 *         description: Cart item added successfully
 *       400:
 *         description: Validation error or inactive cart/product
 *       401:
 *         description: User ID is required
 *       403:
 *         description: Cart does not belong to the user
 *       404:
 *         description: Cart or product not found
 *       409:
 *         description: Product is already in the cart
 */
router.post(
    "/:cartId/items",
    addCartItemController
);

/**
 * @swagger
 * /api/v1/cart/{cartId}/items/{productId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     parameters:
 *       - name: cartId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: x-user-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *       400:
 *         description: Validation error or inactive cart
 *       401:
 *         description: User ID is required
 *       403:
 *         description: Cart does not belong to the user
 *       404:
 *         description: Cart or cart item not found
 */
router.put(
    "/:cartId/items/:productId",
    updateCartItemController
);

/**
 * @swagger
 * /api/v1/cart/{cartId}/items/{productId}:
 *   delete:
 *     summary: Remove product from cart
 *     tags: [Cart]
 *     parameters:
 *       - name: cartId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: productId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: x-user-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart item removed successfully
 *       401:
 *         description: User ID is required
 *       403:
 *         description: Cart does not belong to the user
 *       404:
 *         description: Cart or cart item not found
 */
router.delete(
    "/:cartId/items/:productId",
    removeCartItemController
);

/**
 * @swagger
 * /api/v1/cart/{cartId}/items:
 *   delete:
 *     summary: Clear all items from cart
 *     tags: [Cart]
 *     parameters:
 *       - name: cartId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - name: x-user-id
 *         in: header
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *       400:
 *         description: Cart is inactive
 *       401:
 *         description: User ID is required
 *       403:
 *         description: Cart does not belong to the user
 *       404:
 *         description: Cart not found
 */
router.delete(
    "/:cartId/items",
    clearCartController
);

export default router;