import { Router } from "express";
import rateLimit from "express-rate-limit";
import authenticateUser from "../../middlewares/authenticateUser.middleware.js";
import {
  autocompleteController,
  clearRecentSearchesController,
  deleteRecentSearchController,
  getRecentSearchesController,
  searchController,
} from "./search.controller.js";
import { validateAutocompleteQuery, validateRecentSearchId, validateSearchQuery } from "./search.validation.js";

const router = Router();
const autocompleteLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false, message: { success: false, message: "Too many autocomplete requests. Please slow down.", errors: [] } });
router.use(authenticateUser);
router.get("/", validateSearchQuery, searchController);
router.get("/jobs", validateSearchQuery, (req, _res, next) => { req.validatedQuery.type = "jobs"; next(); }, searchController);
router.get("/autocomplete", autocompleteLimiter, validateAutocompleteQuery, autocompleteController);
router.get("/recent", getRecentSearchesController);
router.delete("/recent/:id", validateRecentSearchId, deleteRecentSearchController);
router.delete("/recent", clearRecentSearchesController);
export default router;
