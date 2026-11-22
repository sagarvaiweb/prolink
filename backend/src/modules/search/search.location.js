const normalizeLocation = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");

export const getLocationTerms = (value) => {
  if (!value) return [];

  const fullLocation = normalizeLocation(String(value));
  if (!fullLocation) return [];

  const terms = new Set([fullLocation]);
  const parts = String(value)
    .split(/[,;|]/)
    .map(normalizeLocation)
    .filter(Boolean);

  for (const part of parts) {
    terms.add(part);

    for (const word of part.split(" ")) {
      terms.add(word);
    }
  }

  return [...terms];
};

export const buildAtlasLocationFilter = (value) => ({
  in: {
    path: "metadata.location",
    value: getLocationTerms(value),
  },
});

export const buildVectorLocationFilter = (value) => ({
  "metadata.location": {
    $in: getLocationTerms(value),
  },
});
