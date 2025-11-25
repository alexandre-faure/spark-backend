import stringSimilarity from "string-similarity";

/**
 * Normalize movie/series titles for better fuzzy matching
 */
function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ") // Remove punctuation
    .replace(/\b(the|a|an|le|la|les|de|du|des)\b/g, "") // Remove articles
    .replace(/\b(season|saison|episode|ep|part|pt)\s*\d+\b/g, "") // Remove Sxx / Exx
    .replace(/\s+/g, " ")            // Collapse spaces
    .trim();
}

/**
 * Compute a distance score between a user query and a real movie/series title.
 * @returns A score between 0 and 1.
 */
export function computeTitleDistanceScore(query: string, target: string): number {
  const q = normalizeTitle(query);
  const t = normalizeTitle(target);

  if (!q || !t) return 0;

  // stringSimilarity returns 0–1
  return stringSimilarity.compareTwoStrings(q, t);
}