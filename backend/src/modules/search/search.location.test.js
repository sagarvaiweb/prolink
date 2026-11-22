import assert from "node:assert/strict";
import test from "node:test";
import { SearchDocument } from "../../models/SearchDocument.model.js";
import { searchQuerySchema } from "./search.validation.js";
import {
  buildAtlasLocationFilter,
  buildVectorLocationFilter,
  getLocationTerms,
} from "./search.location.js";
import {
  buildAtlasTypeFilter,
  buildKeywordSearchQuery,
  buildVectorTypeFilter,
  getSearchBranches,
} from "./search.service.js";

test("location metadata stores normalized city and region terms", () => {
  assert.deepEqual(getLocationTerms("Mahendranagar, Nepal"), [
    "mahendranagar nepal",
    "mahendranagar",
    "nepal",
  ]);

  const document = new SearchDocument({
    entityType: "person",
    entityId: "64b000000000000000000001",
    searchableText: "Frontend developer",
    metadata: { location: getLocationTerms("Mahendranagar, Nepal") },
  });

  assert.deepEqual(document.metadata.location, [
    "mahendranagar nepal",
    "mahendranagar",
    "nepal",
  ]);
});

test("location terms normalize diacritics and punctuation", () => {
  assert.deepEqual(getLocationTerms("São-Paulo, Brazil"), [
    "sao paulo brazil",
    "sao paulo",
    "sao",
    "paulo",
    "brazil",
  ]);
});

test("a different city does not match the city-only filter", () => {
  const queryTerms = getLocationTerms("Mahendranagar");

  assert.equal(
    getLocationTerms("Kathmandu, Nepal").some((term) =>
      queryTerms.includes(term)
    ),
    false
  );
});

test("city-only and full city-country filters share searchable terms", () => {
  const cityTerms = getLocationTerms("Mahendranagar");
  const fullLocationTerms = getLocationTerms("Mahendranagar, Nepal");

  assert.ok(fullLocationTerms.some((term) => cityTerms.includes(term)));
  assert.deepEqual(buildAtlasLocationFilter("Mahendranagar"), {
    in: { path: "metadata.location", value: cityTerms },
  });
  assert.deepEqual(buildVectorLocationFilter("Mahendranagar"), {
    "metadata.location": { $in: cityTerms },
  });
});

test("keyword and vector filters apply location before candidate retrieval", () => {
  const query = {
    q: "frontend developer",
    type: "people",
    mode: "hybrid",
    location: "Mahendranagar",
  };
  const visibilityContext = { visibleUserIds: [] };
  const atlasFilter = buildAtlasTypeFilter("people", query, visibilityContext);
  const keywordQuery = buildKeywordSearchQuery(
    query,
    ["people"],
    visibilityContext
  );
  const vectorFilter = buildVectorTypeFilter("people", query, visibilityContext);
  const locationTerms = getLocationTerms(query.location);

  assert.deepEqual(atlasFilter.compound.filter.at(-1), {
    in: { path: "metadata.location", value: locationTerms },
  });
  assert.deepEqual(keywordQuery.compound.should, [atlasFilter]);
  assert.equal(keywordQuery.compound.must[0].text.query, query.q);
  assert.ok(
    vectorFilter.$and.some(
      (filter) =>
        filter["metadata.location"]?.$in?.join(",") === locationTerms.join(",")
    )
  );
});

test("people and jobs use the same location prefilter in keyword and vector modes", () => {
  const query = { q: "frontend developer", location: "Mahendranagar" };
  const visibilityContext = { visibleUserIds: [] };
  const locationTerms = getLocationTerms(query.location);

  for (const type of ["people", "jobs"]) {
    const atlasFilter = buildAtlasTypeFilter(type, query, visibilityContext);
    const vectorFilter = buildVectorTypeFilter(type, query, visibilityContext);

    assert.ok(
      atlasFilter.compound.filter.some(
        (filter) => filter.in?.path === "metadata.location" &&
          filter.in.value.join(",") === locationTerms.join(",")
      )
    );
    assert.ok(
      vectorFilter.$and.some(
        (filter) =>
          filter["metadata.location"]?.$in?.join(",") === locationTerms.join(",")
      )
    );
  }
});

test("location filters include people and jobs without adding unsupported posts", () => {
  assert.deepEqual(
    getSearchBranches({ type: "all", location: "Mahendranagar" }),
    ["people", "jobs", "companies"]
  );
  assert.deepEqual(
    getSearchBranches({ type: "people", location: "Mahendranagar" }),
    ["people"]
  );
  assert.deepEqual(
    getSearchBranches({ type: "jobs", location: "Mahendranagar" }),
    ["jobs"]
  );
});

test("validated filtered searches retain the query and selected mode", () => {
  const { value, error } = searchQuerySchema.validate({
    q: "frontend developer",
    type: "people",
    mode: "hybrid",
    location: "Mahendranagar",
    page: 1,
  });

  assert.equal(error, undefined);
  assert.equal(value.q, "frontend developer");
  assert.equal(value.mode, "hybrid");
  assert.equal(value.location, "Mahendranagar");
});

test("semantic and hybrid requests retain the location filter", () => {
  for (const mode of ["semantic", "hybrid"]) {
    const { value, error } = searchQuerySchema.validate({
      q: "frontend developer",
      type: "people",
      mode,
      location: "Mahendranagar",
    });

    assert.equal(error, undefined);
    assert.equal(value.q, "frontend developer");
    assert.equal(value.mode, mode);
    assert.deepEqual(buildVectorTypeFilter("people", value, { visibleUserIds: [] }).$and.at(-1), {
      "metadata.location": { $in: getLocationTerms("Mahendranagar") },
    });
  }
});

test("clearing the location filter keeps the original query and mode", () => {
  const { value, error } = searchQuerySchema.validate({
    q: "frontend developer",
    type: "people",
    mode: "hybrid",
  });

  assert.equal(error, undefined);
  assert.equal(value.q, "frontend developer");
  assert.equal(value.mode, "hybrid");
  assert.equal(value.location, undefined);
});
