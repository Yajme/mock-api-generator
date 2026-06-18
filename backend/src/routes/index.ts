import { Router } from "express";
import v0 from "#src/routes/v0/";

const router = Router();

// v0
router.use("/v0", v0);

export default router;
