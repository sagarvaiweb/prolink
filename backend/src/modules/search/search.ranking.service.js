const createKey = ({ entityType, entityId }) =>
  `${entityType}:${String(entityId)}`;

export const reciprocalRankFusion = (rankedLists, constant = 60) => {
  const rankedResults = new Map();

  for (const results of rankedLists) {
    results.forEach((result, index) => {
      const key = createKey(result);
      const current = rankedResults.get(key) || {
        ...result,
        score: 0,
      };

      current.score += 1 / (constant + index + 1);
      rankedResults.set(key, current);
    });
  }

  return [...rankedResults.values()].sort((left, right) => right.score - left.score);
};
