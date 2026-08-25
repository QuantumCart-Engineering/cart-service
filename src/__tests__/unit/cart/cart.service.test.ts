import {
    AppError
} from "../../../utils/app-error";

import {
    getProductById
} from "../../../clients/product/product.client";

import {
    createCartRepository,
    findActiveCartByUserIdRepository,
    findCartWithItemsRepository,
    findCartItemRepository,
    createCartItemRepository,
    updateCartItemQuantityRepository,
    deleteCartItemRepository,
    deleteCartItemsRepository
} from "../../../repositories/cart.repository";

import {
    getOrCreateCartService,
    getCartByIdService,
    addCartItemService,
    updateCartItemService,
    removeCartItemService,
    clearCartService
} from "../../../services/cart.service";

jest.mock(
    "../../../clients/product/product.client",
    () => ({
        getProductById:
            jest.fn()
    })
);

jest.mock(
    "../../../repositories/cart.repository",
    () => ({
        createCartRepository:
            jest.fn(),

        findActiveCartByUserIdRepository:
            jest.fn(),

        findCartWithItemsRepository:
            jest.fn(),

        findCartItemRepository:
            jest.fn(),

        createCartItemRepository:
            jest.fn(),

        updateCartItemQuantityRepository:
            jest.fn(),

        deleteCartItemRepository:
            jest.fn(),

        deleteCartItemsRepository:
            jest.fn()
    })
);

const mockGetProductById =
    getProductById as jest.MockedFunction<
        typeof getProductById
    >;

const mockCreateCartRepository =
    createCartRepository as jest.MockedFunction<
        typeof createCartRepository
    >;

const mockFindActiveCartByUserIdRepository =
    findActiveCartByUserIdRepository as jest.MockedFunction<
        typeof findActiveCartByUserIdRepository
    >;

const mockFindCartWithItemsRepository =
    findCartWithItemsRepository as jest.MockedFunction<
        typeof findCartWithItemsRepository
    >;

const mockFindCartItemRepository =
    findCartItemRepository as jest.MockedFunction<
        typeof findCartItemRepository
    >;

const mockCreateCartItemRepository =
    createCartItemRepository as jest.MockedFunction<
        typeof createCartItemRepository
    >;

const mockUpdateCartItemQuantityRepository =
    updateCartItemQuantityRepository as jest.MockedFunction<
        typeof updateCartItemQuantityRepository
    >;

const mockDeleteCartItemRepository =
    deleteCartItemRepository as jest.MockedFunction<
        typeof deleteCartItemRepository
    >;

const mockDeleteCartItemsRepository =
    deleteCartItemsRepository as jest.MockedFunction<
        typeof deleteCartItemsRepository
    >;

describe(
    "Cart Service",
    () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe(
            "getOrCreateCartService",
            () => {
                it(
                    "should return existing active cart",
                    async () => {
                        const cart = {
                            id: "cart-1",
                            user_id: "user-1",
                            status: "ACTIVE" as const
                        };

                        const cartWithItems = {
                            ...cart,
                            items: []
                        };

                        mockFindActiveCartByUserIdRepository
                            .mockResolvedValue(
                                cart as any
                            );

                        mockFindCartWithItemsRepository
                            .mockResolvedValue(
                                cartWithItems as any
                            );

                        const result =
                            await getOrCreateCartService(
                                "user-1"
                            );

                        expect(
                            mockFindActiveCartByUserIdRepository
                        ).toHaveBeenCalledWith(
                            "user-1"
                        );

                        expect(
                            mockCreateCartRepository
                        ).not.toHaveBeenCalled();

                        expect(
                            result
                        ).toEqual(
                            cartWithItems
                        );
                    }
                );

                it(
                    "should create a cart when active cart does not exist",
                    async () => {
                        const cart = {
                            id: "cart-1",
                            user_id: "user-1",
                            status: "ACTIVE" as const
                        };

                        const cartWithItems = {
                            ...cart,
                            items: []
                        };

                        mockFindActiveCartByUserIdRepository
                            .mockResolvedValue(
                                null
                            );

                        mockCreateCartRepository
                            .mockResolvedValue(
                                cart as any
                            );

                        mockFindCartWithItemsRepository
                            .mockResolvedValue(
                                cartWithItems as any
                            );

                        const result =
                            await getOrCreateCartService(
                                "user-1"
                            );

                        expect(
                            mockCreateCartRepository
                        ).toHaveBeenCalledWith(
                            "user-1"
                        );

                        expect(
                            result
                        ).toEqual(
                            cartWithItems
                        );
                    }
                );
            }
        );

        describe(
            "getCartByIdService",
            () => {
                it(
                    "should return the cart when it belongs to the user",
                    async () => {
                        const cart = {
                            id: "cart-1",
                            user_id: "user-1",
                            status: "ACTIVE",
                            items: []
                        };

                        mockFindCartWithItemsRepository
                            .mockResolvedValue(
                                cart as any
                            );

                        const result =
                            await getCartByIdService(
                                "cart-1",
                                "user-1"
                            );

                        expect(
                            result
                        ).toEqual(
                            cart
                        );
                    }
                );

                it(
                    "should throw 404 when cart does not exist",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue(
                                null
                            );

                        await expect(
                            getCartByIdService(
                                "cart-1",
                                "user-1"
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Cart not found",
                            statusCode: 404
                        });
                    }
                );

                it(
                    "should throw 403 when cart belongs to another user",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue({
                                id: "cart-1",
                                user_id: "another-user",
                                status: "ACTIVE",
                                items: []
                            } as any);

                        await expect(
                            getCartByIdService(
                                "cart-1",
                                "user-1"
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Cart does not belong to this user",
                            statusCode: 403
                        });
                    }
                );
            }
        );

        describe(
            "addCartItemService",
            () => {
                const cart = {
                    id: "cart-1",
                    user_id: "user-1",
                    status: "ACTIVE",
                    items: []
                };

                it(
                    "should add an active product using price from Product Service",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue(
                                cart as any
                            );

                        mockGetProductById
                            .mockResolvedValue({
                                id: "product-1",
                                price: 49999,
                                status: "ACTIVE"
                            });

                        mockFindCartItemRepository
                            .mockResolvedValue(
                                null
                            );

                        const createdItem = {
                            id: "item-1",
                            cart_id: "cart-1",
                            product_id: "product-1",
                            quantity: 2,
                            unit_price: 49999
                        };

                        mockCreateCartItemRepository
                            .mockResolvedValue(
                                createdItem as any
                            );

                        const result =
                            await addCartItemService(
                                "cart-1",
                                "user-1",
                                {
                                    productId:
                                        "product-1",
                                    quantity: 2
                                }
                            );

                        expect(
                            mockGetProductById
                        ).toHaveBeenCalledWith(
                            "product-1"
                        );

                        expect(
                            mockCreateCartItemRepository
                        ).toHaveBeenCalledWith(
                            "cart-1",
                            "product-1",
                            2,
                            49999
                        );

                        expect(
                            result
                        ).toEqual(
                            createdItem
                        );
                    }
                );

                it(
                    "should reject an inactive product",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue(
                                cart as any
                            );

                        mockGetProductById
                            .mockResolvedValue({
                                id: "product-1",
                                price: 49999,
                                status: "INACTIVE"
                            });

                        await expect(
                            addCartItemService(
                                "cart-1",
                                "user-1",
                                {
                                    productId:
                                        "product-1",
                                    quantity: 1
                                }
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Product is inactive",
                            statusCode: 400
                        });

                        expect(
                            mockCreateCartItemRepository
                        ).not.toHaveBeenCalled();
                    }
                );

                it(
                    "should reject duplicate product in cart",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue(
                                cart as any
                            );

                        mockGetProductById
                            .mockResolvedValue({
                                id: "product-1",
                                price: 49999,
                                status: "ACTIVE"
                            });

                        mockFindCartItemRepository
                            .mockResolvedValue({
                                id: "item-1"
                            } as any);

                        await expect(
                            addCartItemService(
                                "cart-1",
                                "user-1",
                                {
                                    productId:
                                        "product-1",
                                    quantity: 1
                                }
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Product is already in the cart",
                            statusCode: 409
                        });
                    }
                );

                it(
                    "should reject adding item to inactive cart",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue({
                                ...cart,
                                status:
                                    "CHECKED_OUT"
                            } as any);

                        await expect(
                            addCartItemService(
                                "cart-1",
                                "user-1",
                                {
                                    productId:
                                        "product-1",
                                    quantity: 1
                                }
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Cannot modify an inactive cart",
                            statusCode: 400
                        });

                        expect(
                            mockGetProductById
                        ).not.toHaveBeenCalled();
                    }
                );
            }
        );

        describe(
            "updateCartItemService",
            () => {
                it(
                    "should update item quantity",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue({
                                id: "cart-1",
                                user_id: "user-1",
                                status: "ACTIVE",
                                items: []
                            } as any);

                        mockFindCartItemRepository
                            .mockResolvedValue({
                                id: "item-1"
                            } as any);

                        mockUpdateCartItemQuantityRepository
                            .mockResolvedValue({
                                id: "item-1",
                                quantity: 5
                            } as any);

                        const result =
                            await updateCartItemService(
                                "cart-1",
                                "user-1",
                                "product-1",
                                {
                                    quantity: 5
                                }
                            );

                        expect(
                            mockUpdateCartItemQuantityRepository
                        ).toHaveBeenCalledWith(
                            "cart-1",
                            "product-1",
                            5
                        );

                        expect(
                            result
                        ).toEqual({
                            id: "item-1",
                            quantity: 5
                        });
                    }
                );

                it(
                    "should throw 404 when cart item does not exist",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue({
                                id: "cart-1",
                                user_id: "user-1",
                                status: "ACTIVE",
                                items: []
                            } as any);

                        mockFindCartItemRepository
                            .mockResolvedValue(
                                null
                            );

                        await expect(
                            updateCartItemService(
                                "cart-1",
                                "user-1",
                                "product-1",
                                {
                                    quantity: 5
                                }
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Cart item not found",
                            statusCode: 404
                        });
                    }
                );
            }
        );

        describe(
            "removeCartItemService",
            () => {
                it(
                    "should remove an existing cart item",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue({
                                id: "cart-1",
                                user_id: "user-1",
                                status: "ACTIVE",
                                items: []
                            } as any);

                        mockFindCartItemRepository
                            .mockResolvedValue({
                                id: "item-1"
                            } as any);

                        mockDeleteCartItemRepository
                            .mockResolvedValue(
                                undefined
                            );

                        const result =
                            await removeCartItemService(
                                "cart-1",
                                "user-1",
                                "product-1"
                            );

                        expect(
                            mockDeleteCartItemRepository
                        ).toHaveBeenCalledWith(
                            "cart-1",
                            "product-1"
                        );

                        expect(
                            result
                        ).toEqual({
                            message:
                                "Cart item removed successfully"
                        });
                    }
                );

                it(
                    "should throw 404 when cart item does not exist",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue({
                                id: "cart-1",
                                user_id: "user-1",
                                status: "ACTIVE",
                                items: []
                            } as any);

                        mockFindCartItemRepository
                            .mockResolvedValue(
                                null
                            );

                        await expect(
                            removeCartItemService(
                                "cart-1",
                                "user-1",
                                "product-1"
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Cart item not found",
                            statusCode: 404
                        });
                    }
                );
            }
        );

        describe(
            "clearCartService",
            () => {
                it(
                    "should clear all cart items",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue({
                                id: "cart-1",
                                user_id: "user-1",
                                status: "ACTIVE",
                                items: []
                            } as any);

                        mockDeleteCartItemsRepository
                            .mockResolvedValue(
                                undefined
                            );

                        const result =
                            await clearCartService(
                                "cart-1",
                                "user-1"
                            );

                        expect(
                            mockDeleteCartItemsRepository
                        ).toHaveBeenCalledWith(
                            "cart-1"
                        );

                        expect(
                            result
                        ).toEqual({
                            message:
                                "Cart cleared successfully"
                        });
                    }
                );

                it(
                    "should reject clearing an inactive cart",
                    async () => {
                        mockFindCartWithItemsRepository
                            .mockResolvedValue({
                                id: "cart-1",
                                user_id: "user-1",
                                status:
                                    "CHECKED_OUT",
                                items: []
                            } as any);

                        await expect(
                            clearCartService(
                                "cart-1",
                                "user-1"
                            )
                        ).rejects.toMatchObject({
                            message:
                                "Cannot modify an inactive cart",
                            statusCode: 400
                        });

                        expect(
                            mockDeleteCartItemsRepository
                        ).not.toHaveBeenCalled();
                    }
                );
            }
        );
    }
);