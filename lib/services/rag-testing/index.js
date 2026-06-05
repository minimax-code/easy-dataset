/**
 * RAG evaluation orchestrator — coordinates endpoint client, metrics, and judge.
 */
import { createRAGClient } from './endpoint-client';
import { recallAtK, mrr, ndcgAtK, contextPrecision, contextRecall } from './metrics';

export async function evaluateQuestion(client, question, relevantChunkIds) {
  const startTime = Date.now();
  const response = await client.sendQuestion(question);
  const duration = Date.now() - startTime;

  const retrievedIds = response.retrievedChunkIds;
  const relIds = typeof relevantChunkIds === 'string' ? JSON.parse(relevantChunkIds) : relevantChunkIds;

  return {
    agentAnswer: response.answer,
    retrievedChunkIds: JSON.stringify(retrievedIds),
    retrievedContext: response.context,
    rawResponse: JSON.stringify(response.rawResponse),
    sessionId: response.sessionId,
    recallAt1: recallAtK(retrievedIds, relIds, 1),
    recallAt3: recallAtK(retrievedIds, relIds, 3),
    recallAt5: recallAtK(retrievedIds, relIds, 5),
    recallAt10: recallAtK(retrievedIds, relIds, 10),
    mrr: mrr(retrievedIds, relIds),
    ndcgAt10: ndcgAtK(retrievedIds, relIds, 10),
    contextPrecision: contextPrecision(retrievedIds, relIds),
    contextRecall: contextRecall(retrievedIds, relIds),
    duration,
    status: 1
  };
}
