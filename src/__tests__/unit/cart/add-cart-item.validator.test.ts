import {
    validateAddCartItem
} from "../../../validators/cart/add-cart-item.validator";

import {
    AppError
} from "../../../utils/app-error";

describe("Add Cart Item Validator", () => {
    it("should accept valid cart item data", () => {
        expect(() =>
            validateAddCartItem({
                productId:
                    "83cb7256-2c66-44aa-90cf-49550570e925",
                quantity: 2
            })
        ).not.toThrow();
    });

    it("should throw when request body is missing", () => {
        expect(() =>
            validateAddCartItem(undefined)
        ).toThrow(
            new AppError(
                "Request body is required",
                400
            )
        );
    });

    it("should throw when productId is missing", () => {
        expect(() =>
            validateAddCartItem({
                quantity: 2
            })
        ).toThrow(
            new AppError(
                "Product ID is required",
                400
            )
        );
    });

    it("should throw when productId is empty", () => {
        expect(() =>
            validateAddCartItem({
                productId: "   ",
                quantity: 2
            })
        ).toThrow(
            new AppError(
                "Product ID is required",
                400
            )
        );
    });

    it("should throw when quantity is missing", () => {
        expect(() =>
            validateAddCartItem({
                productId: "product-001"
            })
        ).toThrow(
            new AppError(
                "Quantity must be a positive integer",
                400
            )
        );
    });

    it("should throw when quantity is zero", () => {
        expect(() =>
            validateAddCartItem({
                productId: "product-001",
                quantity: 0
            })
        ).toThrow(
            new AppError(
                "Quantity must be a positive integer",
                400
            )
        );
    });

    it("should throw when quantity is negative", () => {
        expect(() =>
            validateAddCartItem({
                productId: "product-001",
                quantity: -1
            })
        ).toThrow(
            new AppError(
                "Quantity must be a positive integer",
                400
            )
        );
    });

    it("should throw when quantity is not an integer", () => {
        expect(() =>
            validateAddCartItem({
                productId: "product-001",
                quantity: 2.5
            })
        ).toThrow(
            new AppError(
                "Quantity must be a positive integer",
                400
            )
        );
    });

    it("should throw when productId is not a string", () => {
        expect(() =>
            validateAddCartItem({
                productId: 123,
                quantity: 2
            })
        ).toThrow(
            new AppError(
                "Product ID is required",
                400
            )
        );
    });
});