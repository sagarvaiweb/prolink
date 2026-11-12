import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import { rateLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { searchJobsController } from "./search.controller.js";
import { validateSearchQuery } from "./search.validation.js";

const router = Router();
router.use(authenticateUser);
router.get("/jobs", rateLimiter, validateSearchQuery, searchJobsController);

export default router;
