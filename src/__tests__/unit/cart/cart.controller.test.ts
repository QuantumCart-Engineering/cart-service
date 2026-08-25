import {
    Request,
    Response
} from "express";

import {
    getCartController,
    getCartByIdController,
    addCartItemController,
    updateCartItemController,
    removeCartItemController,
    clearCartController
} from "../../../controllers/cart.controller";

import {
    getOrCreateCartService,
    getCartByIdService,
    addCartItemService,
    updateCartItemService,
    removeCartItemService,
    clearCartService
} from "../../../services/cart.service";

import {
    validateAddCartItem
} from "../../../validators/cart/add-cart-item.validator";

import {
    validateUpdateCartItem
} from "../../../validators/cart/update-cart-item.validator";

jest.mock(
    "../../../services/cart.service",
    () => ({
        getOrCreateCartService:
            jest.fn(),

        getCartByIdService:
            jest.fn(),

        addCartItemService:
            jest.fn(),

        updateCartItemService:
            jest.fn(),

        removeCartItemService:
            jest.fn(),

        clearCartService:
            jest.fn()
    })
);

jest.mock(
    "../../../validators/cart/add-cart-item.validator",
    () => ({
        validateAddCartItem:
            jest.fn()
    })
);

jest.mock(
    "../../../validators/cart/update-cart-item.validator",
    () => ({
        validateUpdateCartItem:
            jest.fn()
    })
);

const mockGetOrCreateCartService =
    getOrCreateCartService as jest.MockedFunction<
        typeof getOrCreateCartService
    >;

const mockGetCartByIdService =
    getCartByIdService as jest.MockedFunction<
        typeof getCartByIdService
    >;

const mockAddCartItemService =
    addCartItemService as jest.MockedFunction<
        typeof addCartItemService
    >;

const mockUpdateCartItemService =
    updateCartItemService as jest.MockedFunction<
        typeof updateCartItemService
    >;

const mockRemoveCartItemService =
    removeCartItemService as jest.MockedFunction<
        typeof removeCartItemService
    >;

const mockClearCartService =
    clearCartService as jest.MockedFunction<
        typeof clearCartService
    >;

const mockValidateAddCartItem =
    validateAddCartItem as jest.MockedFunction<
        typeof validateAddCartItem
    >;

const mockValidateUpdateCartItem =
    validateUpdateCartItem as jest.MockedFunction<
        typeof validateUpdateCartItem
    >;

const createRequest = (
    options: {
        userId?: string;
        params?: Record<
            string,
            string
        >;
        body?: unknown;
    } = {}
): Request => {
    const {
        userId,
        params = {},
        body = {}
    } = options;

    return {
        params,
        body,
        header: jest.fn(
            (name: string) => {
                if (
                    name.toLowerCase() ===
                        "x-user-id" &&
                    userId !== undefined
                ) {
                    return userId;
                }

                return undefined;
            }
        )
    } as unknown as Request;
};

const createResponse = () => {
    const response =
        {} as Response;

    response.status =
        jest.fn().mockReturnValue(
            response
        );

    response.json =
        jest.fn().mockReturnValue(
            response
        );

    return response;
};

describe(
    "Cart Controller",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe(
            "getCartController",
            () => {
                it(
                    "should return the user's active cart",
                    async () => {
                        const req =
                            createRequest({
                                userId:
                                    "user-1"
                            });

                        const res =
                            createResponse();

                        const cart = {
                            id:
                                "cart-1",
                            user_id:
                                "user-1",
                            status:
                                "ACTIVE",
                            items:
                                []
                        };

                        mockGetOrCreateCartService
                            .mockResolvedValue(
                                cart as any
                            );

                        await getCartController(
                            req,
                            res
                        );

                        expect(
                            mockGetOrCreateCartService
                        ).toHaveBeenCalledWith(
                            "user-1"
                        );

                        expect(
                            res.status
                        ).toHaveBeenCalledWith(
                            200
                        );

                        expect(
                            res.json
                        ).toHaveBeenCalledWith({
                            success:
                                true,
                            data:
                                cart
                        });
                    }
                );

                it(
                    "should throw 401 when user ID is missing",
                    async () => {
                        const req =
                            createRequest();

                        const res =
                            createResponse();

                        await expect(
                            getCartController(
                                req,
                                res
                            )
                        ).rejects.toMatchObject({
                            message:
                                "User ID is required",
                            statusCode:
                                401
                        });

                        expect(
                            mockGetOrCreateCartService
                        ).not.toHaveBeenCalled();
                    }
                );
            }
        );

        describe(
            "getCartByIdController",
            () => {
                it(
                    "should return cart by ID",
                    async () => {
                        const req =
                            createRequest({
                                userId:
                                    "user-1",
                                params: {
                                    cartId:
                                        "cart-1"
                                }
                            });

                        const res =
                            createResponse();

                        const cart = {
                            id:
                                "cart-1",
                            user_id:
                                "user-1",
                            status:
                                "ACTIVE",
                            items:
                                []
                        };

                        mockGetCartByIdService
                            .mockResolvedValue(
                                cart as any
                            );

                        await getCartByIdController(
                            req,
                            res
                        );

                        expect(
                            mockGetCartByIdService
                        ).toHaveBeenCalledWith(
                            "cart-1",
                            "user-1"
                        );

                        expect(
                            res.status
                        ).toHaveBeenCalledWith(
                            200
                        );

                        expect(
                            res.json
                        ).toHaveBeenCalledWith({
                            success:
                                true,
                            data:
                                cart
                        });
                    }
                );

                it(
                    "should throw 400 when cart ID is missing",
                    async () => {
                        const req =
                            createRequest({
                                userId:
                                    "user-1"
                            });

                        const res =
                            createResponse();

                        await expect(
                            getCartByIdController(
                                req,
                                res
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Cart ID is required",
                            statusCode:
                                400
                        });
                    }
                );

                it(
                    "should throw 401 when user ID is missing",
                    async () => {
                        const req =
                            createRequest({
                                params: {
                                    cartId:
                                        "cart-1"
                                }
                            });

                        const res =
                            createResponse();

                        await expect(
                            getCartByIdController(
                                req,
                                res
                            )
                        ).rejects.toMatchObject({
                            message:
                                "User ID is required",
                            statusCode:
                                401
                        });
                    }
                );
            }
        );

        describe(
            "addCartItemController",
            () => {
                it(
                    "should add cart item successfully",
                    async () => {
                        const body = {
                            productId:
                                "product-1",
                            quantity:
                                2
                        };

                        const item = {
                            id:
                                "item-1",
                            cart_id:
                                "cart-1",
                            product_id:
                                "product-1",
                            quantity:
                                2,
                            unit_price:
                                49999
                        };

                        const req =
                            createRequest({
                                userId:
                                    "user-1",
                                params: {
                                    cartId:
                                        "cart-1"
                                },
                                body
                            });

                        const res =
                            createResponse();

                        mockAddCartItemService
                            .mockResolvedValue(
                                item as any
                            );

                        await addCartItemController(
                            req,
                            res
                        );

                        expect(
                            mockValidateAddCartItem
                        ).toHaveBeenCalledWith(
                            body
                        );

                        expect(
                            mockAddCartItemService
                        ).toHaveBeenCalledWith(
                            "cart-1",
                            "user-1",
                            body
                        );

                        expect(
                            res.status
                        ).toHaveBeenCalledWith(
                            201
                        );

                        expect(
                            res.json
                        ).toHaveBeenCalledWith({
                            success:
                                true,
                            message:
                                "Cart item added successfully",
                            data:
                                item
                        });
                    }
                );

                it(
                    "should throw 401 when user ID is missing",
                    async () => {
                        const req =
                            createRequest({
                                params: {
                                    cartId:
                                        "cart-1"
                                },
                                body: {
                                    productId:
                                        "product-1",
                                    quantity:
                                        1
                                }
                            });

                        const res =
                            createResponse();

                        await expect(
                            addCartItemController(
                                req,
                                res
                            )
                        ).rejects.toMatchObject({
                            message:
                                "User ID is required",
                            statusCode:
                                401
                        });

                        expect(
                            mockValidateAddCartItem
                        ).not.toHaveBeenCalled();
                    }
                );

                it(
                    "should throw 400 when cart ID is missing",
                    async () => {
                        const req =
                            createRequest({
                                userId:
                                    "user-1",
                                body: {
                                    productId:
                                        "product-1",
                                    quantity:
                                        1
                                }
                            });

                        const res =
                            createResponse();

                        await expect(
                            addCartItemController(
                                req,
                                res
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Cart ID is required",
                            statusCode:
                                400
                        });
                    }
                );
            }
        );

        describe(
            "updateCartItemController",
            () => {
                it(
                    "should update cart item successfully",
                    async () => {
                        const body = {
                            quantity:
                                5
                        };

                        const item = {
                            id:
                                "item-1",
                            cart_id:
                                "cart-1",
                            product_id:
                                "product-1",
                            quantity:
                                5,
                            unit_price:
                                49999
                        };

                        const req =
                            createRequest({
                                userId:
                                    "user-1",
                                params: {
                                    cartId:
                                        "cart-1",
                                    productId:
                                        "product-1"
                                },
                                body
                            });

                        const res =
                            createResponse();

                        mockUpdateCartItemService
                            .mockResolvedValue(
                                item as any
                            );

                        await updateCartItemController(
                            req,
                            res
                        );

                        expect(
                            mockValidateUpdateCartItem
                        ).toHaveBeenCalledWith(
                            body
                        );

                        expect(
                            mockUpdateCartItemService
                        ).toHaveBeenCalledWith(
                            "cart-1",
                            "user-1",
                            "product-1",
                            body
                        );

                        expect(
                            res.status
                        ).toHaveBeenCalledWith(
                            200
                        );

                        expect(
                            res.json
                        ).toHaveBeenCalledWith({
                            success:
                                true,
                            message:
                                "Cart item updated successfully",
                            data:
                                item
                        });
                    }
                );

                it(
                    "should throw 400 when product ID is missing",
                    async () => {
                        const req =
                            createRequest({
                                userId:
                                    "user-1",
                                params: {
                                    cartId:
                                        "cart-1"
                                },
                                body: {
                                    quantity:
                                        5
                                }
                            });

                        const res =
                            createResponse();

                        await expect(
                            updateCartItemController(
                                req,
                                res
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Product ID is required",
                            statusCode:
                                400
                        });
                    }
                );
            }
        );

        describe(
            "removeCartItemController",
            () => {
                it(
                    "should remove cart item successfully",
                    async () => {
                        const result = {
                            message:
                                "Cart item removed successfully"
                        };

                        const req =
                            createRequest({
                                userId:
                                    "user-1",
                                params: {
                                    cartId:
                                        "cart-1",
                                    productId:
                                        "product-1"
                                }
                            });

                        const res =
                            createResponse();

                        mockRemoveCartItemService
                            .mockResolvedValue(
                                result
                            );

                        await removeCartItemController(
                            req,
                            res
                        );

                        expect(
                            mockRemoveCartItemService
                        ).toHaveBeenCalledWith(
                            "cart-1",
                            "user-1",
                            "product-1"
                        );

                        expect(
                            res.status
                        ).toHaveBeenCalledWith(
                            200
                        );

                        expect(
                            res.json
                        ).toHaveBeenCalledWith({
                            success:
                                true,
                            ...result
                        });
                    }
                );

                it(
                    "should throw 401 when user ID is missing",
                    async () => {
                        const req =
                            createRequest({
                                params: {
                                    cartId:
                                        "cart-1",
                                    productId:
                                        "product-1"
                                }
                            });

                        const res =
                            createResponse();

                        await expect(
                            removeCartItemController(
                                req,
                                res
                            )
                        ).rejects.toMatchObject({
                            message:
                                "User ID is required",
                            statusCode:
                                401
                        });
                    }
                );
            }
        );

        describe(
            "clearCartController",
            () => {
                it(
                    "should clear cart successfully",
                    async () => {
                        const result = {
                            message:
                                "Cart cleared successfully"
                        };

                        const req =
                            createRequest({
                                userId:
                                    "user-1",
                                params: {
                                    cartId:
                                        "cart-1"
                                }
                            });

                        const res =
                            createResponse();

                        mockClearCartService
                            .mockResolvedValue(
                                result
                            );

                        await clearCartController(
                            req,
                            res
                        );

                        expect(
                            mockClearCartService
                        ).toHaveBeenCalledWith(
                            "cart-1",
                            "user-1"
                        );

                        expect(
                            res.status
                        ).toHaveBeenCalledWith(
                            200
                        );

                        expect(
                            res.json
                        ).toHaveBeenCalledWith({
                            success:
                                true,
                            ...result
                        });
                    }
                );

                it(
                    "should throw 400 when cart ID is missing",
                    async () => {
                        const req =
                            createRequest({
                                userId:
                                    "user-1"
                            });

                        const res =
                            createResponse();

                        await expect(
                            clearCartController(
                                req,
                                res
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Cart ID is required",
                            statusCode:
                                400
                        });
                    }
                );
            }
        );
    }
);