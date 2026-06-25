import { Router } from "express";
import authRouter from "./auth";
import userRouter from "./users";
import schemaRouter from "./schema";
import * as mockController from "#src/controllers/mockController";
import { authenticateJwt } from "#src/middleware/authenticateJwt";

const router = Router();

// Authentication routes
router.use("/auth", authRouter);

// JWT Authorization is now required on this point
router.use("/users", authenticateJwt, userRouter);
router.use("/schema", authenticateJwt, schemaRouter);

router.post("/endpoint", authenticateJwt, mockController.createEndpoint);

// List all endpoints for the authenticated user
router.get("/endpoints", authenticateJwt, mockController.listUserEndpoints);

// Update / patch a specific endpoint by id
router.patch("/endpoints/:id", authenticateJwt, mockController.updateUserEndpoint);
router.put("/endpoints/:id", authenticateJwt, mockController.updateUserEndpoint);

// Delete a specific endpoint by id
router.delete("/endpoints/:id", authenticateJwt, mockController.deleteUserEndpoint);

export default router;
