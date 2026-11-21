import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";
import { search } from "./search.controller.js";
import { searchQuerySchema } from "./search.validation.js";

const router = Router();

router.use(authenticateUser);
router.get("/", validateQuery(searchQuerySchema), search);

export default router;
