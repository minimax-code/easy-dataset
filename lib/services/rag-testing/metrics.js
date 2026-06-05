/**
 * RAG evaluation metrics — pure functions, no side effects.
 */

// Stop words for content matching
const STOP_WORDS = new Set([
  '的', '是', '在', '和', '了', '有', '这', '那', '要', '就', '也', '能', '会', '对', '与', '为', '等', '中', '到', '从',
  'the', 'is', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'was', 'were', 'are', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its'
]);

/**
 * Extract keywords from text (remove stop words, keep important terms).
 */
function extractKeywords(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^\w一-龥]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 30);
}

/**
 * Calculate content overlap ratio between two texts.
 * Returns 0.0 - 1.0 based on keyword intersection.
 */
function contentOverlap(text1, text2) {
  const words1 = extractKeywords(text1);
  const words2 = extractKeywords(text2);

  if (words1.length === 0 || words2.length === 0) return 0;

  const set2 = new Set(words2);
  const intersection = words1.filter(w => set2.has(w));

  return intersection.length / Math.min(words1.length, words2.length);
}

/**
 * Content-based Recall@K: check if relevant content appears in top-K retrieved snippets.
 * @param {string[]} retrievedContents - ordered list of retrieved content snippets
 * @param {string[]} relevantContents - list of ground-truth relevant content
 * @param {number} k - top-K to check
 * @param {number} threshold - minimum overlap ratio to consider a match (default 0.3)
 * @returns {number} 0.0 – 1.0
 */
export function recallAtKByContent(retrievedContents, relevantContents, k, threshold = 0.3) {
  if (!relevantContents.length) return 0;
  const topK = retrievedContents.slice(0, k);

  let hits = 0;
  for (const relevant of relevantContents) {
    for (const retrieved of topK) {
      if (contentOverlap(relevant, retrieved) >= threshold) {
        hits++;
        break;
      }
    }
  }
  return hits / relevantContents.length;
}

/**
 * Content-based MRR: find rank of first content match.
 */
export function mrrByContent(retrievedContents, relevantContents, threshold = 0.3) {
  if (!relevantContents.length) return 0;

  for (let i = 0; i < retrievedContents.length; i++) {
    for (const relevant of relevantContents) {
      if (contentOverlap(relevant, retrievedContents[i]) >= threshold) {
        return 1 / (i + 1);
      }
    }
  }
  return 0;
}

/**
 * Content-based NDCG@K.
 */
export function ndcgAtKByContent(retrievedContents, relevantContents, k, threshold = 0.3) {
  if (!relevantContents.length) return 0;
  const topK = retrievedContents.slice(0, k);

  // DCG - relevance based on content match
  let dcg = 0;
  for (let i = 0; i < topK.length; i++) {
    let rel = 0;
    for (const relevant of relevantContents) {
      if (contentOverlap(relevant, topK[i]) >= threshold) {
        rel = 1;
        break;
      }
    }
    dcg += rel / Math.log2(i + 2);
  }

  // Ideal DCG (all relevant items in top positions)
  const idealLen = Math.min(relevantContents.length, k);
  let idcg = 0;
  for (let i = 0; i < idealLen; i++) {
    idcg += 1 / Math.log2(i + 2);
  }

  return idcg === 0 ? 0 : dcg / idcg;
}

/**
 * Content-based Context Precision.
 */
export function contextPrecisionByContent(retrievedContents, relevantContents, threshold = 0.3) {
  if (!retrievedContents.length) return 0;

  let hits = 0;
  for (const retrieved of retrievedContents) {
    for (const relevant of relevantContents) {
      if (contentOverlap(relevant, retrieved) >= threshold) {
        hits++;
        break;
      }
    }
  }
  return hits / retrievedContents.length;
}

/**
 * Content-based Context Recall.
 */
export function contextRecallByContent(retrievedContents, relevantContents, threshold = 0.3) {
  return recallAtKByContent(retrievedContents, relevantContents, retrievedContents.length, threshold);
}

/**
 * Recall@K: fraction of relevant items found in top-K results.
 * @param {string[]} retrievedIds - ordered list of retrieved IDs
 * @param {string[]} relevantIds - set of ground-truth relevant IDs
 * @param {number} k
 * @returns {number} 0.0 – 1.0
 */
export function recallAtK(retrievedIds, relevantIds, k) {
  if (!relevantIds.length) return 0;
  const topK = retrievedIds.slice(0, k);
  const relSet = new Set(relevantIds);
  const hits = topK.filter(id => relSet.has(id)).length;
  return hits / relevantIds.length;
}

/**
 * MRR (Mean Reciprocal Rank): 1/rank of first relevant result.
 */
export function mrr(retrievedIds, relevantIds) {
  if (!relevantIds.length) return 0;
  const relSet = new Set(relevantIds);
  for (let i = 0; i < retrievedIds.length; i++) {
    if (relSet.has(retrievedIds[i])) {
      return 1 / (i + 1);
    }
  }
  return 0;
}

/**
 * NDCG@K (Normalized Discounted Cumulative Gain).
 * Binary relevance: relevant = 1, not relevant = 0.
 */
export function ndcgAtK(retrievedIds, relevantIds, k) {
  if (!relevantIds.length) return 0;
  const relSet = new Set(relevantIds);
  const topK = retrievedIds.slice(0, k);

  // DCG
  let dcg = 0;
  for (let i = 0; i < topK.length; i++) {
    const rel = relSet.has(topK[i]) ? 1 : 0;
    dcg += rel / Math.log2(i + 2); // i+2 because log base is position+1
  }

  // Ideal DCG
  const idealLen = Math.min(relevantIds.length, k);
  let idcg = 0;
  for (let i = 0; i < idealLen; i++) {
    idcg += 1 / Math.log2(i + 2);
  }

  return idcg === 0 ? 0 : dcg / idcg;
}

/**
 * Context Precision: fraction of retrieved chunks that are relevant.
 */
export function contextPrecision(retrievedIds, relevantIds) {
  if (!retrievedIds.length) return 0;
  const relSet = new Set(relevantIds);
  const hits = retrievedIds.filter(id => relSet.has(id)).length;
  return hits / retrievedIds.length;
}

/**
 * Context Recall: fraction of relevant chunks that were retrieved.
 */
export function contextRecall(retrievedIds, relevantIds) {
  if (!relevantIds.length) return 0;
  const retSet = new Set(retrievedIds);
  const hits = relevantIds.filter(id => retSet.has(id)).length;
  return hits / relevantIds.length;
}
