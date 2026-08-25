import {
    AppError
} from "../../utils/app-error";

import {
    AddCartItemDto
} from "../../dtos/cart/add-cart-item.dto";

export function validateAddCartItem(
    data: unknown
): asserts data is AddCartItemDto {
    if (
        !data ||
        typeof data !== "object"
    ) {
        throw new AppError(
            "Request body is required",
            400
        );
    }

    const body =
        data as Record<string, unknown>;

    if (
        typeof body.productId !==
            "string" ||
        !body.productId.trim()
    ) {
        throw new AppError(
            "Product ID is required",
            400
        );
    }

    if (
        typeof body.quantity !==
            "number" ||
        !Number.isInteger(
            body.quantity
        ) ||
        body.quantity < 1
    ) {
        throw new AppError(
            "Quantity must be a positive integer",
            400
        );
    }
}