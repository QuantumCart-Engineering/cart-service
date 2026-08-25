import {
    AppError
} from "../../utils/app-error";

import {
    UpdateCartItemDto
} from "../../dtos/cart/update-cart-item.dto";

export function validateUpdateCartItem(
    data: unknown
): asserts data is UpdateCartItemDto {
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