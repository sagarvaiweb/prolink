import { Router } from "express";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import authorizeRole from "../../middlewares/authorizeRoles.middleware.js";
import { autocompleteRateLimiter } from "../../middlewares/rateLimiter.middleware.js";
import validateParams from "../../middlewares/validateParams.middleware.js";
import validateQuery from "../../middlewares/validateQuery.middleware.js";
import {
  autocomplete,
  clearRecentSearches,
  deleteRecentSearch,
  getRecentSearches,
  getSearchHealth,
  search,
} from "./search.controller.js";
import { autocompleteQuerySchema } from "./autocomplete.validation.js";
import {
  recentSearchListQuerySchema,
  recentSearchParamsSchema,
} from "./recentSearch.validation.js";
import { searchQuerySchema } from "./search.validation.js";

const router = Router();

router.use(authenticateUser);
router.get("/health", authorizeRole("admin"), getSearchHealth);
router.get(
  "/autocomplete",
  autocompleteRateLimiter,
  validateQuery(autocompleteQuerySchema),
  autocomplete
);
router.get(
  "/recent",
  validateQuery(recentSearchListQuerySchema),
  getRecentSearches
);
router.delete(
  "/recent/:id",
  validateParams(recentSearchParamsSchema),
  deleteRecentSearch
);
router.delete("/recent", clearRecentSearches);
router.get("/", validateQuery(searchQuerySchema), search);

export default router;
