import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import analyzeRouter from "./analyze";
import analyzeClothingRouter from "./analyze-clothing";
import chatRouter from "./chat";
import makeupTryOnRouter from "./makeup-try-on";
import removeBackgroundRouter from "./remove-background";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(analyzeRouter);
router.use(analyzeClothingRouter);
router.use(chatRouter);
router.use(makeupTryOnRouter);
router.use(removeBackgroundRouter);

export default router;
