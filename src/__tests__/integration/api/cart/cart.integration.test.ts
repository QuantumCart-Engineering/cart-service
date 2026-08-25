import request from "supertest";
import { randomUUID } from "crypto";

import app from "../../../../app";
import pool from "../../../../config/database";

describe("Cart API Integration", () => {
    const userId = randomUUID();
    const anotherUserId = randomUUID();

    const productId =
        "83cb7256-2c66-44aa-90cf-49550570e925";

    const nonExistingProductId =
        "00000000-0000-0000-0000-000000000000";

    let cartId: string;

    /**
     * Create the cart that will be used
     * throughout the integration tests.
     */
    beforeAll(async () => {
        const response =
            await request(app)
                .get("/api/v1/cart")
                .set(
                    "x-user-id",
                    userId
                )
                .expect(200);

        cartId =
            response.body.data.id;
    });

    /**
     * Close MySQL connection pool after
     * all integration tests complete.
     *
     * Without this Jest may remain running
     * because MySQL keeps connections open.
     */
    afterAll(async () => {
        await pool.end();
    });

    // =========================================================
    // GET /health
    // =========================================================

    describe("GET /health", () => {
        it("should return service health", async () => {
            const response =
                await request(app)
                    .get("/health")
                    .expect(200);

            expect(
                response.body
            ).toEqual({
                success: true,
                data: {
                    service:
                        "cart-service",
                    status: "UP"
                }
            });
        });
    });

    // =========================================================
    // GET /api/v1/cart
    // =========================================================

    describe("GET /api/v1/cart", () => {
        it("should create and return an active cart", async () => {
            const response =
                await request(app)
                    .get("/api/v1/cart")
                    .set(
                        "x-user-id",
                        userId
                    )
                    .expect(200);

            expect(
                response.body.success
            ).toBe(true);

            expect(
                response.body.data
            ).toMatchObject({
                id: expect.any(String),
                user_id: userId,
                status: "ACTIVE",
                items: []
            });

            expect(
                response.body.data.created_at
            ).toEqual(
                expect.any(String)
            );

            expect(
                response.body.data.updated_at
            ).toEqual(
                expect.any(String)
            );
        });

        it("should return the same active cart for the user", async () => {
            const firstResponse =
                await request(app)
                    .get("/api/v1/cart")
                    .set(
                        "x-user-id",
                        userId
                    )
                    .expect(200);

            const secondResponse =
                await request(app)
                    .get("/api/v1/cart")
                    .set(
                        "x-user-id",
                        userId
                    )
                    .expect(200);

            expect(
                secondResponse.body.data.id
            ).toBe(
                firstResponse.body.data.id
            );

            expect(
                secondResponse.body.data.status
            ).toBe("ACTIVE");
        });

        it("should return 401 when user ID is missing", async () => {
            const response =
                await request(app)
                    .get("/api/v1/cart")
                    .expect(401);

            expect(
                response.body
            ).toEqual({
                message:
                    "User ID is required"
            });
        });
    });

    // =========================================================
    // GET /api/v1/cart/:cartId
    // =========================================================

    describe("GET /api/v1/cart/:cartId", () => {
        it("should return the cart with items", async () => {
            const response =
                await request(app)
                    .get(
                        `/api/v1/cart/${cartId}`
                    )
                    .set(
                        "x-user-id",
                        userId
                    )
                    .expect(200);

            expect(
                response.body.success
            ).toBe(true);

            expect(
                response.body.data
            ).toMatchObject({
                id: cartId,
                user_id: userId,
                status: "ACTIVE",
                items: expect.any(Array)
            });
        });

        it("should return 403 when cart belongs to another user", async () => {
            const response =
                await request(app)
                    .get(
                        `/api/v1/cart/${cartId}`
                    )
                    .set(
                        "x-user-id",
                        anotherUserId
                    )
                    .expect(403);

            expect(
                response.body
            ).toEqual({
                message:
                    "Cart does not belong to this user"
            });
        });

        it("should return 404 for a non-existing cart", async () => {
            const response =
                await request(app)
                    .get(
                        `/api/v1/cart/${nonExistingProductId}`
                    )
                    .set(
                        "x-user-id",
                        userId
                    )
                    .expect(404);

            expect(
                response.body
            ).toEqual({
                message:
                    "Cart not found"
            });
        });
    });

    // =========================================================
    // POST /api/v1/cart/:cartId/items
    // =========================================================

    describe(
        "POST /api/v1/cart/:cartId/items",
        () => {
            it("should add an active product to the cart", async () => {
                const response =
                    await request(app)
                        .post(
                            `/api/v1/cart/${cartId}/items`
                        )
                        .set(
                            "x-user-id",
                            userId
                        )
                        .send({
                            productId,
                            quantity: 2
                        })
                        .expect(201);

                expect(
                    response.body
                ).toMatchObject({
                    success: true,
                    message:
                        "Cart item added successfully"
                });

                expect(
                    response.body.data
                ).toMatchObject({
                    id: expect.any(String),
                    cart_id: cartId,
                    product_id:
                        productId,
                    quantity: 2,
                    unit_price:
                        expect.any(Number)
                });
            });

            it("should reject duplicate product in the cart", async () => {
                const response =
                    await request(app)
                        .post(
                            `/api/v1/cart/${cartId}/items`
                        )
                        .set(
                            "x-user-id",
                            userId
                        )
                        .send({
                            productId,
                            quantity: 1
                        })
                        .expect(409);

                expect(
                    response.body
                ).toEqual({
                    message:
                        "Product is already in the cart"
                });
            });

            it("should return 400 for invalid quantity", async () => {
                const response =
                    await request(app)
                        .post(
                            `/api/v1/cart/${cartId}/items`
                        )
                        .set(
                            "x-user-id",
                            userId
                        )
                        .send({
                            productId,
                            quantity: 0
                        })
                        .expect(400);

                expect(
                    response.body
                ).toEqual({
                    message:
                        "Quantity must be a positive integer"
                });
            });

            it("should return 404 when product does not exist", async () => {
                const response =
                    await request(app)
                        .post(
                            `/api/v1/cart/${cartId}/items`
                        )
                        .set(
                            "x-user-id",
                            userId
                        )
                        .send({
                            productId:
                                nonExistingProductId,
                            quantity: 1
                        })
                        .expect(404);

                expect(
                    response.body
                ).toEqual({
                    message:
                        "Product not found"
                });
            });
        }
    );

    // =========================================================
    // PUT /api/v1/cart/:cartId/items/:productId
    // =========================================================

    describe(
        "PUT /api/v1/cart/:cartId/items/:productId",
        () => {
            it("should update cart item quantity", async () => {
                const response =
                    await request(app)
                        .put(
                            `/api/v1/cart/${cartId}/items/${productId}`
                        )
                        .set(
                            "x-user-id",
                            userId
                        )
                        .send({
                            quantity: 5
                        })
                        .expect(200);

                expect(
                    response.body
                ).toMatchObject({
                    success: true,
                    message:
                        "Cart item updated successfully"
                });

                expect(
                    response.body.data
                ).toMatchObject({
                    cart_id: cartId,
                    product_id:
                        productId,
                    quantity: 5
                });
            });

            it("should return 400 for invalid quantity", async () => {
                const response =
                    await request(app)
                        .put(
                            `/api/v1/cart/${cartId}/items/${productId}`
                        )
                        .set(
                            "x-user-id",
                            userId
                        )
                        .send({
                            quantity: 0
                        })
                        .expect(400);

                expect(
                    response.body
                ).toEqual({
                    message:
                        "Quantity must be a positive integer"
                });
            });

            it("should return 404 when cart item does not exist", async () => {
                const response =
                    await request(app)
                        .put(
                            `/api/v1/cart/${cartId}/items/${nonExistingProductId}`
                        )
                        .set(
                            "x-user-id",
                            userId
                        )
                        .send({
                            quantity: 5
                        })
                        .expect(404);

                expect(
                    response.body
                ).toEqual({
                    message:
                        "Cart item not found"
                });
            });
        }
    );

    // =========================================================
    // DELETE /api/v1/cart/:cartId/items/:productId
    // =========================================================

    describe(
        "DELETE /api/v1/cart/:cartId/items/:productId",
        () => {
            it("should remove a cart item", async () => {
                const response =
                    await request(app)
                        .delete(
                            `/api/v1/cart/${cartId}/items/${productId}`
                        )
                        .set(
                            "x-user-id",
                            userId
                        )
                        .expect(200);

                expect(
                    response.body
                ).toEqual({
                    success: true,
                    message:
                        "Cart item removed successfully"
                });
            });

            it("should return 404 when cart item does not exist", async () => {
                const response =
                    await request(app)
                        .delete(
                            `/api/v1/cart/${cartId}/items/${productId}`
                        )
                        .set(
                            "x-user-id",
                            userId
                        )
                        .expect(404);

                expect(
                    response.body
                ).toEqual({
                    message:
                        "Cart item not found"
                });
            });
        }
    );

    // =========================================================
    // DELETE /api/v1/cart/:cartId/items
    // =========================================================

    describe(
        "DELETE /api/v1/cart/:cartId/items",
        () => {
            it("should clear all cart items", async () => {
                /*
                 * Add an item first so that the clear
                 * operation has something to remove.
                 */
                await request(app)
                    .post(
                        `/api/v1/cart/${cartId}/items`
                    )
                    .set(
                        "x-user-id",
                        userId
                    )
                    .send({
                        productId,
                        quantity: 3
                    })
                    .expect(201);

                const response =
                    await request(app)
                        .delete(
                            `/api/v1/cart/${cartId}/items`
                        )
                        .set(
                            "x-user-id",
                            userId
                        )
                        .expect(200);

                expect(
                    response.body
                ).toEqual({
                    success: true,
                    message:
                        "Cart cleared successfully"
                });
            });

            it("should return an empty cart after clearing", async () => {
                const response =
                    await request(app)
                        .get(
                            `/api/v1/cart/${cartId}`
                        )
                        .set(
                            "x-user-id",
                            userId
                        )
                        .expect(200);

                expect(
                    response.body.success
                ).toBe(true);

                expect(
                    response.body.data.items
                ).toEqual([]);
            });
        }
    );
});