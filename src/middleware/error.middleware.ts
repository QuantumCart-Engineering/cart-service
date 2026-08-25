import {
    Request,
    Response,
    NextFunction
} from "express";

import {
    AppError
} from "../utils/app-error";

export const errorMiddleware = (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
): void => {
    if (error instanceof AppError) {
        response.status(
            error.statusCode
        ).json({
            message: error.message
        });

        return;
    }

    console.error(
        "Unhandled error:",
        error
    );

    response.status(500).json({
        message:
            "Internal server error"
    });
};