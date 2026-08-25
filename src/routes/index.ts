import {
    Router
} from "express";

import cartRoutes from "./cart.routes";
import healthRoutes from "./health.routes";

const router =
    Router();

router.use(
    "/api/v1/cart",
    cartRoutes
);

router.use(
    "/health",
    healthRoutes
);

export default router;