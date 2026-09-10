import {
    AppError
} from "../../utils/app-error";

interface ProductResponse {
    success: boolean;

    data: {
        id: string;

        price: number;

        status:
            | "ACTIVE"
            | "INACTIVE";
    };
}

export interface ProductDetails {
    id: string;

    price: number;

    status:
        | "ACTIVE"
        | "INACTIVE";
}

export const productServiceUrl =
    process.env.PRODUCT_SERVICE_URL ||
    "http://localhost:8002";

export const getProductById =
    async (
        productId: string
    ): Promise<ProductDetails> => {
        let response: Response;

        try {
            response = await fetch(
                `${productServiceUrl}/api/v1/products/${productId}`
            );
        } catch (error) {
            console.error(
                "Product service request failed:",
                error
            );

            throw new AppError(
                "Product service unavailable",
                502
            );
        }

        if (
            response.status === 404
        ) {
            throw new AppError(
                "Product not found",
                404
            );
        }

        if (!response.ok) {
            throw new AppError(
                "Product service unavailable",
                502
            );
        }

        let body: ProductResponse;

        try {
            body =
                (await response.json()) as ProductResponse;
        } catch {
            throw new AppError(
                "Invalid response from product service",
                502
            );
        }

        if (
            !body.success ||
            !body.data
        ) {
            throw new AppError(
                "Invalid response from product service",
                502
            );
        }

        return {
            id: body.data.id,

            price:
                Number(
                    body.data.price
                ),

            status:
                body.data.status
        };
    };