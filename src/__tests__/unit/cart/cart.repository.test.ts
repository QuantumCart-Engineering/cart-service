import {
    createCartRepository,
    findActiveCartByUserIdRepository,
    findCartByIdRepository,
    findCartItemsRepository,
    findCartWithItemsRepository,
    findCartItemRepository,
    createCartItemRepository,
    updateCartItemQuantityRepository,
    deleteCartItemRepository,
    deleteCartItemsRepository,
    updateCartStatusRepository
} from "../../../repositories/cart.repository";

import pool from "../../../config/database";

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
} from "../../../queries/cart.queries";

jest.mock("../../../config/database", () => ({
    __esModule: true,
    default: {
        execute: jest.fn(),
        query: jest.fn()
    }
}));

const mockPool = pool as jest.Mocked<typeof pool>;

const createMockCart = () => ({
    id: "cart-001",
    user_id: "user-001",
    status: "ACTIVE" as const,
    created_at: new Date("2026-08-25T03:00:00.000Z"),
    updated_at: new Date("2026-08-25T03:00:00.000Z")
});

const createMockCartItem = () => ({
    id: "item-001",
    cart_id: "cart-001",
    product_id: "product-001",
    quantity: 2,
    unit_price: 49999,
    created_at: new Date("2026-08-25T03:01:00.000Z"),
    updated_at: new Date("2026-08-25T03:01:00.000Z")
});

describe("Cart Repository", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("createCartRepository", () => {
        it("should create and return a cart", async () => {
            const cart = createMockCart();

            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 1,
                    insertId: 0
                },
                []
            ] as never);

            mockPool.query.mockResolvedValueOnce([
                [cart],
                []
            ] as never);

            const result =
                await createCartRepository(
                    "user-001"
                );

            expect(mockPool.execute)
                .toHaveBeenCalledWith(
                    createCartQuery,
                    [
                        expect.any(String),
                        "user-001"
                    ]
                );

            expect(mockPool.query)
                .toHaveBeenCalledWith(
                    findCartByIdQuery,
                    [
                        expect.any(String)
                    ]
                );

            expect(result).toEqual(cart);
        });

        it("should throw when created cart cannot be retrieved", async () => {
            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 1,
                    insertId: 0
                },
                []
            ] as never);

            mockPool.query.mockResolvedValueOnce([
                [],
                []
            ] as never);

            await expect(
                createCartRepository(
                    "user-001"
                )
            ).rejects.toThrow(
                "Cart was created but could not be retrieved"
            );
        });
    });

    describe("findActiveCartByUserIdRepository", () => {
        it("should return the active cart", async () => {
            const cart = createMockCart();

            mockPool.query.mockResolvedValueOnce([
                [cart],
                []
            ] as never);

            const result =
                await findActiveCartByUserIdRepository(
                    "user-001"
                );

            expect(mockPool.query)
                .toHaveBeenCalledWith(
                    findActiveCartByUserIdQuery,
                    ["user-001"]
                );

            expect(result).toEqual(cart);
        });

        it("should return null when active cart does not exist", async () => {
            mockPool.query.mockResolvedValueOnce([
                [],
                []
            ] as never);

            const result =
                await findActiveCartByUserIdRepository(
                    "user-001"
                );

            expect(result).toBeNull();
        });
    });

    describe("findCartByIdRepository", () => {
        it("should return cart by ID", async () => {
            const cart = createMockCart();

            mockPool.query.mockResolvedValueOnce([
                [cart],
                []
            ] as never);

            const result =
                await findCartByIdRepository(
                    "cart-001"
                );

            expect(mockPool.query)
                .toHaveBeenCalledWith(
                    findCartByIdQuery,
                    ["cart-001"]
                );

            expect(result).toEqual(cart);
        });

        it("should return null when cart does not exist", async () => {
            mockPool.query.mockResolvedValueOnce([
                [],
                []
            ] as never);

            const result =
                await findCartByIdRepository(
                    "cart-001"
                );

            expect(result).toBeNull();
        });
    });

    describe("findCartItemsRepository", () => {
        it("should return cart items", async () => {
            const item = createMockCartItem();

            mockPool.query.mockResolvedValueOnce([
                [item],
                []
            ] as never);

            const result =
                await findCartItemsRepository(
                    "cart-001"
                );

            expect(mockPool.query)
                .toHaveBeenCalledWith(
                    findCartItemsQuery,
                    ["cart-001"]
                );

            expect(result).toEqual([
                item
            ]);
        });

        it("should return an empty array when cart has no items", async () => {
            mockPool.query.mockResolvedValueOnce([
                [],
                []
            ] as never);

            const result =
                await findCartItemsRepository(
                    "cart-001"
                );

            expect(result).toEqual([]);
        });

        it("should convert unit_price to number", async () => {
            const item = {
                ...createMockCartItem(),
                unit_price: "49999.50"
            };

            mockPool.query.mockResolvedValueOnce([
                [item],
                []
            ] as never);

            const result =
                await findCartItemsRepository(
                    "cart-001"
                );

            expect(result[0].unit_price)
                .toBe(49999.5);

            expect(
                typeof result[0].unit_price
            ).toBe("number");
        });
    });

    describe("findCartWithItemsRepository", () => {
        it("should return cart with its items", async () => {
            const cart = createMockCart();
            const item = createMockCartItem();

            mockPool.query
                .mockResolvedValueOnce([
                    [cart],
                    []
                ] as never)
                .mockResolvedValueOnce([
                    [item],
                    []
                ] as never);

            const result =
                await findCartWithItemsRepository(
                    "cart-001"
                );

            expect(result).toEqual({
                ...cart,
                items: [
                    item
                ]
            });

            expect(mockPool.query)
                .toHaveBeenNthCalledWith(
                    1,
                    findCartByIdQuery,
                    ["cart-001"]
                );

            expect(mockPool.query)
                .toHaveBeenNthCalledWith(
                    2,
                    findCartItemsQuery,
                    ["cart-001"]
                );
        });

        it("should return null when cart does not exist", async () => {
            mockPool.query.mockResolvedValueOnce([
                [],
                []
            ] as never);

            const result =
                await findCartWithItemsRepository(
                    "cart-001"
                );

            expect(result).toBeNull();

            expect(mockPool.query)
                .toHaveBeenCalledTimes(1);
        });
    });

    describe("findCartItemRepository", () => {
        it("should return cart item", async () => {
            const item = createMockCartItem();

            mockPool.query.mockResolvedValueOnce([
                [item],
                []
            ] as never);

            const result =
                await findCartItemRepository(
                    "cart-001",
                    "product-001"
                );

            expect(mockPool.query)
                .toHaveBeenCalledWith(
                    findCartItemQuery,
                    [
                        "cart-001",
                        "product-001"
                    ]
                );

            expect(result).toEqual(item);
        });

        it("should return null when item does not exist", async () => {
            mockPool.query.mockResolvedValueOnce([
                [],
                []
            ] as never);

            const result =
                await findCartItemRepository(
                    "cart-001",
                    "product-001"
                );

            expect(result).toBeNull();
        });

        it("should convert unit_price to number", async () => {
            const item = {
                ...createMockCartItem(),
                unit_price: "1250.75"
            };

            mockPool.query.mockResolvedValueOnce([
                [item],
                []
            ] as never);

            const result =
                await findCartItemRepository(
                    "cart-001",
                    "product-001"
                );

            expect(result?.unit_price)
                .toBe(1250.75);
        });
    });

    describe("createCartItemRepository", () => {
        it("should create and return a cart item", async () => {
            const item = createMockCartItem();

            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 1,
                    insertId: 0
                },
                []
            ] as never);

            mockPool.query.mockResolvedValueOnce([
                [item],
                []
            ] as never);

            const result =
                await createCartItemRepository(
                    "cart-001",
                    "product-001",
                    2,
                    49999
                );

            expect(mockPool.execute)
                .toHaveBeenCalledWith(
                    createCartItemQuery,
                    [
                        expect.any(String),
                        "cart-001",
                        "product-001",
                        2,
                        49999
                    ]
                );

            expect(mockPool.query)
                .toHaveBeenCalledWith(
                    findCartItemQuery,
                    [
                        "cart-001",
                        "product-001"
                    ]
                );

            expect(result).toEqual(item);
        });

        it("should throw when created item cannot be retrieved", async () => {
            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 1,
                    insertId: 0
                },
                []
            ] as never);

            mockPool.query.mockResolvedValueOnce([
                [],
                []
            ] as never);

            await expect(
                createCartItemRepository(
                    "cart-001",
                    "product-001",
                    2,
                    49999
                )
            ).rejects.toThrow(
                "Cart item was created but could not be retrieved"
            );
        });
    });

    describe("updateCartItemQuantityRepository", () => {
        it("should update and return cart item", async () => {
            const item = {
                ...createMockCartItem(),
                quantity: 5
            };

            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 1,
                    insertId: 0
                },
                []
            ] as never);

            mockPool.query.mockResolvedValueOnce([
                [item],
                []
            ] as never);

            const result =
                await updateCartItemQuantityRepository(
                    "cart-001",
                    "product-001",
                    5
                );

            expect(mockPool.execute)
                .toHaveBeenCalledWith(
                    updateCartItemQuantityQuery,
                    [
                        5,
                        "cart-001",
                        "product-001"
                    ]
                );

            expect(result).toEqual(item);
        });

        it("should throw when no cart item was updated", async () => {
            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 0,
                    insertId: 0
                },
                []
            ] as never);

            await expect(
                updateCartItemQuantityRepository(
                    "cart-001",
                    "product-001",
                    5
                )
            ).rejects.toThrow(
                "Cart item could not be updated"
            );
        });

        it("should throw when updated item cannot be retrieved", async () => {
            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 1,
                    insertId: 0
                },
                []
            ] as never);

            mockPool.query.mockResolvedValueOnce([
                [],
                []
            ] as never);

            await expect(
                updateCartItemQuantityRepository(
                    "cart-001",
                    "product-001",
                    5
                )
            ).rejects.toThrow(
                "Cart item was updated but could not be retrieved"
            );
        });
    });

    describe("deleteCartItemRepository", () => {
        it("should delete a cart item", async () => {
            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 1,
                    insertId: 0
                },
                []
            ] as never);

            await expect(
                deleteCartItemRepository(
                    "cart-001",
                    "product-001"
                )
            ).resolves.toBeUndefined();

            expect(mockPool.execute)
                .toHaveBeenCalledWith(
                    deleteCartItemQuery,
                    [
                        "cart-001",
                        "product-001"
                    ]
                );
        });
    });

    describe("deleteCartItemsRepository", () => {
        it("should delete all cart items", async () => {
            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 3,
                    insertId: 0
                },
                []
            ] as never);

            await expect(
                deleteCartItemsRepository(
                    "cart-001"
                )
            ).resolves.toBeUndefined();

            expect(mockPool.execute)
                .toHaveBeenCalledWith(
                    deleteCartItemsQuery,
                    ["cart-001"]
                );
        });
    });

    describe("updateCartStatusRepository", () => {
        it("should update and return cart status", async () => {
            const cart = {
                ...createMockCart(),
                status: "CHECKED_OUT" as const
            };

            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 1,
                    insertId: 0
                },
                []
            ] as never);

            mockPool.query.mockResolvedValueOnce([
                [cart],
                []
            ] as never);

            const result =
                await updateCartStatusRepository(
                    "cart-001",
                    "CHECKED_OUT"
                );

            expect(mockPool.execute)
                .toHaveBeenCalledWith(
                    updateCartStatusQuery,
                    [
                        "CHECKED_OUT",
                        "cart-001"
                    ]
                );

            expect(result).toEqual(cart);
        });

        it("should throw when cart status was not updated", async () => {
            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 0,
                    insertId: 0
                },
                []
            ] as never);

            await expect(
                updateCartStatusRepository(
                    "cart-001",
                    "CHECKED_OUT"
                )
            ).rejects.toThrow(
                "Cart status could not be updated"
            );
        });

        it("should throw when updated cart cannot be retrieved", async () => {
            mockPool.execute.mockResolvedValueOnce([
                {
                    affectedRows: 1,
                    insertId: 0
                },
                []
            ] as never);

            mockPool.query.mockResolvedValueOnce([
                [],
                []
            ] as never);

            await expect(
                updateCartStatusRepository(
                    "cart-001",
                    "CHECKED_OUT"
                )
            ).rejects.toThrow(
                "Cart was updated but could not be retrieved"
            );
        });
    });
});