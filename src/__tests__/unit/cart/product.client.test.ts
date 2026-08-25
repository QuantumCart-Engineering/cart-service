import {
    getProductById
} from "../../../clients/product/product.client";

describe(
    "Product Client",
    () => {
        const originalFetch =
            global.fetch;

        beforeEach(() => {
            global.fetch =
                jest.fn();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        afterAll(() => {
            global.fetch =
                originalFetch;
        });

        it(
            "should return product details for a successful response",
            async () => {
                (
                    global.fetch as jest.Mock
                ).mockResolvedValue({
                    status: 200,
                    ok: true,
                    json:
                        jest.fn()
                            .mockResolvedValue({
                                success: true,
                                data: {
                                    id:
                                        "product-1",
                                    price:
                                        49999,
                                    status:
                                        "ACTIVE"
                                }
                            })
                });

                const result =
                    await getProductById(
                        "product-1"
                    );

                expect(
                    global.fetch
                ).toHaveBeenCalledWith(
                    "http://localhost:8002/api/v1/products/product-1"
                );

                expect(
                    result
                ).toEqual({
                    id:
                        "product-1",
                    price:
                        49999,
                    status:
                        "ACTIVE"
                });
            }
        );

        it(
            "should convert product price to number",
            async () => {
                (
                    global.fetch as jest.Mock
                ).mockResolvedValue({
                    status: 200,
                    ok: true,
                    json:
                        jest.fn()
                            .mockResolvedValue({
                                success: true,
                                data: {
                                    id:
                                        "product-1",
                                    price:
                                        "49999",
                                    status:
                                        "ACTIVE"
                                }
                            })
                });

                const result =
                    await getProductById(
                        "product-1"
                    );

                expect(
                    result.price
                ).toBe(49999);

                expect(
                    typeof result.price
                ).toBe("number");
            }
        );

        it(
            "should throw 404 when product does not exist",
            async () => {
                (
                    global.fetch as jest.Mock
                ).mockResolvedValue({
                    status: 404,
                    ok: false
                });

                await expect(
                    getProductById(
                        "missing-product"
                    )
                ).rejects.toMatchObject({
                    message:
                        "Product not found",
                    statusCode: 404
                });
            }
        );

        it(
            "should throw 502 when product service returns another error status",
            async () => {
                (
                    global.fetch as jest.Mock
                ).mockResolvedValue({
                    status: 500,
                    ok: false
                });

                await expect(
                    getProductById(
                        "product-1"
                    )
                ).rejects.toMatchObject({
                    message:
                        "Product service unavailable",
                    statusCode: 502
                });
            }
        );

        it(
            "should throw 502 when product service request fails",
            async () => {
                (
                    global.fetch as jest.Mock
                ).mockRejectedValue(
                    new Error(
                        "ECONNREFUSED"
                    )
                );

                await expect(
                    getProductById(
                        "product-1"
                    )
                ).rejects.toMatchObject({
                    message:
                        "Product service unavailable",
                    statusCode: 502
                });
            }
        );

        it(
            "should throw 502 when response contains invalid JSON",
            async () => {
                (
                    global.fetch as jest.Mock
                ).mockResolvedValue({
                    status: 200,
                    ok: true,
                    json:
                        jest.fn()
                            .mockRejectedValue(
                                new Error(
                                    "Invalid JSON"
                                )
                            )
                });

                await expect(
                    getProductById(
                        "product-1"
                    )
                ).rejects.toMatchObject({
                    message:
                        "Invalid response from product service",
                    statusCode: 502
                });
            }
        );

        it(
            "should throw 502 when response success is false",
            async () => {
                (
                    global.fetch as jest.Mock
                ).mockResolvedValue({
                    status: 200,
                    ok: true,
                    json:
                        jest.fn()
                            .mockResolvedValue({
                                success: false,
                                data: null
                            })
                });

                await expect(
                    getProductById(
                        "product-1"
                    )
                ).rejects.toMatchObject({
                    message:
                        "Invalid response from product service",
                    statusCode: 502
                });
            }
        );

        it(
            "should throw 502 when response data is missing",
            async () => {
                (
                    global.fetch as jest.Mock
                ).mockResolvedValue({
                    status: 200,
                    ok: true,
                    json:
                        jest.fn()
                            .mockResolvedValue({
                                success: true
                            })
                });

                await expect(
                    getProductById(
                        "product-1"
                    )
                ).rejects.toMatchObject({
                    message:
                        "Invalid response from product service",
                    statusCode: 502
                });
            }
        );
    }
);