import { Router, type IRouter } from "express";
import healthRouter from "./health";
import packRouter from "./pack";

const router: IRouter = Router();

router.use(healthRouter);
router.use(packRouter);

export default router;
