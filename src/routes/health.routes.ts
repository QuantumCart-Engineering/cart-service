import {
    Router,
    Request,
    Response
} from "express";

const router =
    Router();

router.get(
    "/",
    (
        _req: Request,
        res: Response
    ) => {
        return res.status(200).json({
            success: true,
            data: {
                service:
                    "cart-service",
                status: "UP"
            }
        });
    }
);

export default router;