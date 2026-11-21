import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import { autocompleteRateLimiter } from "../../middlewares/rateLimiter.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";
import { autocomplete, search } from "./search.controller.js";
import { autocompleteQuerySchema } from "./autocomplete.validation.js";
import { searchQuerySchema } from "./search.validation.js";

const router = Router();

router.use(authenticateUser);
router.get(
  "/autocomplete",
  autocompleteRateLimiter,
  validateQuery(autocompleteQuerySchema),
  autocomplete
);
router.get("/", validateQuery(searchQuerySchema), search);

export default router;
