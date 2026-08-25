import {
    validateUpdateCartItem
} from "../../../validators/cart/update-cart-item.validator";

import {
    AppError
} from "../../../utils/app-error";

describe("Update Cart Item Validator", () => {
    it("should accept valid quantity", () => {
        expect(() =>
            validateUpdateCartItem({
                quantity: 5
            })
        ).not.toThrow();
    });

    it("should throw when request body is missing", () => {
        expect(() =>
            validateUpdateCartItem(undefined)
        ).toThrow(
            new AppError(
                "Request body is required",
                400
            )
        );
    });

    it("should throw when quantity is missing", () => {
        expect(() =>
            validateUpdateCartItem({})
        ).toThrow(
            new AppError(
                "Quantity must be a positive integer",
                400
            )
        );
    });

    it("should throw when quantity is zero", () => {
        expect(() =>
            validateUpdateCartItem({
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
            validateUpdateCartItem({
                quantity: -5
            })
        ).toThrow(
            new AppError(
                "Quantity must be a positive integer",
                400
            )
        );
    });

    it("should throw when quantity is a decimal", () => {
        expect(() =>
            validateUpdateCartItem({
                quantity: 2.5
            })
        ).toThrow(
            new AppError(
                "Quantity must be a positive integer",
                400
            )
        );
    });

    it("should throw when quantity is a string", () => {
        expect(() =>
            validateUpdateCartItem({
                quantity: "5"
            })
        ).toThrow(
            new AppError(
                "Quantity must be a positive integer",
                400
            )
        );
    });

    it("should throw when request body is not an object", () => {
        expect(() =>
            validateUpdateCartItem("invalid")
        ).toThrow(
            new AppError(
                "Request body is required",
                400
            )
        );
    });
});