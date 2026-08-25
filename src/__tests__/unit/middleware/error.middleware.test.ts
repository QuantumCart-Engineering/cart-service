import {
    Request,
    Response,
    NextFunction
} from "express";

import {
    errorMiddleware
} from "../../../middleware/error.middleware";

import {
    AppError
} from "../../../utils/app-error";

describe("Error Middleware", () => {
    let request: Request;
    let response: Response;
    let next: NextFunction;

    beforeEach(() => {
        request = {} as Request;

        response = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as unknown as Response;

        next = jest.fn();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it(
        "should handle AppError with its status code and message",
        () => {
            const error =
                new AppError(
                    "Product not found",
                    404
                );

            errorMiddleware(
                error,
                request,
                response,
                next
            );

            expect(
                response.status
            ).toHaveBeenCalledWith(404);

            expect(
                response.json
            ).toHaveBeenCalledWith({
                message:
                    "Product not found"
            });
        }
    );

    it(
        "should handle AppError with a 400 status",
        () => {
            const error =
                new AppError(
                    "Invalid request",
                    400
                );

            errorMiddleware(
                error,
                request,
                response,
                next
            );

            expect(
                response.status
            ).toHaveBeenCalledWith(400);

            expect(
                response.json
            ).toHaveBeenCalledWith({
                message:
                    "Invalid request"
            });
        }
    );

    it(
        "should return 500 for an unknown Error",
        () => {
            const error =
                new Error(
                    "Something went wrong"
                );

            const consoleErrorSpy =
                jest
                    .spyOn(
                        console,
                        "error"
                    )
                    .mockImplementation();

            errorMiddleware(
                error,
                request,
                response,
                next
            );

            expect(
                consoleErrorSpy
            ).toHaveBeenCalledWith(
                "Unhandled error:",
                error
            );

            expect(
                response.status
            ).toHaveBeenCalledWith(500);

            expect(
                response.json
            ).toHaveBeenCalledWith({
                message:
                    "Internal server error"
            });
        }
    );

    it(
        "should return 500 for a non-Error value",
        () => {
            const error =
                "unexpected failure";

            const consoleErrorSpy =
                jest
                    .spyOn(
                        console,
                        "error"
                    )
                    .mockImplementation();

            errorMiddleware(
                error,
                request,
                response,
                next
            );

            expect(
                consoleErrorSpy
            ).toHaveBeenCalledWith(
                "Unhandled error:",
                error
            );

            expect(
                response.status
            ).toHaveBeenCalledWith(500);

            expect(
                response.json
            ).toHaveBeenCalledWith({
                message:
                    "Internal server error"
            });
        }
    );

    it(
        "should not call next",
        () => {
            const error =
                new AppError(
                    "Unauthorized",
                    401
                );

            errorMiddleware(
                error,
                request,
                response,
                next
            );

            expect(
                next
            ).not.toHaveBeenCalled();
        }
    );
});