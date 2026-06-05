/**
 * RAG evaluation task processor.
 * Loads endpoint → iterates questions → sends to agent → collects response → computes metrics → saves results.
 */
import { TASK } from '@/constant';
import { updateTask } from './index';
import { createRAGClient } from '@/lib/services/rag-testing/endpoint-client';
import { recallAtK, mrr, ndcgAtK, contextPrecision, contextRecall } from '@/lib/services/rag-testing/metrics';
import { recallAtKByContent, mrrByContent, ndcgAtKByContent, contextPrecisionByContent, contextRecallByContent } from '@/lib/services/rag-testing/metrics';
import { getChunksByIds } from '@/lib/db/chunks';
import { RAGJudge } from '@/lib/services/rag-testing/judge';
import LLMClient from '@/lib/llm/core/index';
import {
  getEvalRunById,
  updateEvalRun,
  createEvalResult,
  updateEvalResult,
  createTrace
} from '@/lib/db/ragEvalResults';
import { getEndpointById } from '@/lib/db/ragEndpoints';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function processRagEvaluationTask(task) {
  const detail = typeof task.detail === 'string' ? JSON.parse(task.detail) : task.detail;
  const { evalRunId } = detail;

  try {
    const evalRun = await getEvalRunById(evalRunId);
    if (!evalRun) throw new Error(`Eval run not found: ${evalRunId}`);

    const endpoint = await getEndpointById(evalRun.endpointId);
    if (!endpoint) throw new Error(`Endpoint not found: ${evalRun.endpointId}`);

    const client = createRAGClient(endpoint);
    const questions = evalRun.testSet.questions.filter(q => q.status === 1);
    const evalOptions = typeof evalRun.evalOptions === 'string' ? JSON.parse(evalRun.evalOptions) : evalRun.evalOptions;

    // Initialize Judge if judge model configured
    let judge = null;
    if (evalRun.judgeModelId && (evalOptions.faithfulness || evalOptions.relevancy)) {
      const modelConfig = await prisma.modelConfig.findUnique({ where: { id: evalRun.judgeModelId } });
      if (modelConfig) {
        judge = new RAGJudge(new LLMClient(modelConfig));
      }
    }

    await updateTask(task.id, { totalCount: questions.length });

    const results = [];
    let completed = 0;

    for (const question of questions) {
      const startTime = Date.now();
      try {
        // Send question to RAG Agent
        const response = await client.sendQuestion(question.question);
        const duration = Date.now() - startTime;

        // Get relevant chunk contents from Easy Dataset for content-based matching
        const relevantChunkIds = JSON.parse(question.relevantChunkIds || '[]');
        const relevantChunks = await getChunksByIds(relevantChunkIds);
        const relevantContents = relevantChunks.map(c => c.content);

        // Get retrieved contents from RAG Agent response
        let retrievedContents = response.sources?.map(s => s.snippet) || [];
        if (!retrievedContents.length && response.context) {
          // Fallback: split context by delimiter if sources not available
          retrievedContents = response.context.split('\n---\n').filter(s => s.trim());
        }

        // Compute content-based retrieval metrics (for cross-system evaluation)
        const metrics = {
          // Content-based metrics (primary for cross-system)
          recallAt1: recallAtKByContent(retrievedContents, relevantContents, 1),
          recallAt3: recallAtKByContent(retrievedContents, relevantContents, 3),
          recallAt5: recallAtKByContent(retrievedContents, relevantContents, 5),
          recallAt10: recallAtKByContent(retrievedContents, relevantContents, 10),
          mrr: mrrByContent(retrievedContents, relevantContents),
          ndcgAt10: ndcgAtKByContent(retrievedContents, relevantContents, 10),
          contextPrecision: contextPrecisionByContent(retrievedContents, relevantContents),
          contextRecall: contextRecallByContent(retrievedContents, relevantContents)
        };

        // Also compute ID-based metrics if IDs match (for same-system evaluation)
        const retrievedIds = response.retrievedChunkIds || [];
        if (retrievedIds.length > 0 && relevantChunkIds.length > 0) {
          // Check if IDs overlap (same system)
          const idOverlap = retrievedIds.filter(id => relevantChunkIds.includes(id)).length;
          if (idOverlap > 0) {
            metrics.idBasedRecallAt5 = recallAtK(retrievedIds, relevantChunkIds, 5);
            metrics.idBasedMrr = mrr(retrievedIds, relevantChunkIds);
            metrics.idBasedNdcgAt10 = ndcgAtK(retrievedIds, relevantChunkIds, 10);
          }
        }

        const result = await createEvalResult({
          evalRunId: evalRun.id,
          questionId: question.id,
          agentAnswer: response.answer,
          retrievedChunkIds: JSON.stringify(response.retrievedChunkIds || []),
          retrievedContext: response.context,
          rawResponse: JSON.stringify(response.rawResponse),
          sessionId: response.sessionId,
          ...metrics,
          duration,
          status: 1
        });

        // LLM Judge scoring
        if (judge && response.answer) {
          const updates = {};
          try {
            if (evalOptions.faithfulness && response.context) {
              const f = await judge.judgeFaithfulness(response.context, response.answer);
              updates.faithfulness = f.score;
              updates.faithfulnessExplanation = f.explanation;
            }
          } catch (e) { console.error('Faithfulness judge failed:', e); }

          try {
            if (evalOptions.relevancy) {
              const r = await judge.judgeRelevancy(question.question, response.answer);
              updates.relevancy = r.score;
              updates.relevancyExplanation = r.explanation;
            }
          } catch (e) { console.error('Relevancy judge failed:', e); }

          if (Object.keys(updates).length > 0) {
            await updateEvalResult(result.id, updates);
            Object.assign(result, updates);
          }
        }

        // Trace evaluation
        if (evalOptions.traceEval && response.trace && response.trace.length > 0) {
          try {
            const traceMetrics = judge
              ? await judge.judgeTrace(question.question, response.trace)
              : { toolSelectionAccuracy: 0, reasoningCoherence: 0, redundantSteps: 0 };

            const totalDuration = response.trace.reduce((acc, s) => acc + (s.duration_ms || 0), 0);
            await createTrace({
              projectId: evalRun.projectId,
              evalResultId: result.id,
              steps: JSON.stringify(response.trace),
              totalSteps: response.trace.length,
              totalDuration,
              metrics: JSON.stringify(traceMetrics)
            });

            await updateEvalResult(result.id, {
              traceId: result.id,
              toolCallCount: response.trace.length,
              toolSelectionAccuracy: traceMetrics.toolSelectionAccuracy,
              reasoningCoherence: traceMetrics.reasoningCoherence
            });
          } catch (e) { console.error('Trace evaluation failed:', e); }
        }

        results.push(result);
      } catch (error) {
        console.error(`Failed to evaluate question ${question.id}:`, error);
        await createEvalResult({
          evalRunId: evalRun.id,
          questionId: question.id,
          status: 2,
          errorMessage: error.message,
          duration: Date.now() - startTime
        });
      }

      completed++;
      await updateTask(task.id, { completedCount: completed });

      // Check for interruption
      const currentTask = await prisma.task.findUnique({ where: { id: task.id } });
      if (currentTask?.status === 3) {
        console.log(`RAG evaluation task interrupted: ${task.id}`);
        return;
      }
    }

    // Compute aggregate metrics
    const completedResults = results.filter(r => r.status === 1);
    const aggregateMetrics = computeAggregateMetrics(completedResults);
    await updateEvalRun(evalRunId, { aggregateMetrics: JSON.stringify(aggregateMetrics) });

    await updateTask(task.id, { status: TASK.STATUS.COMPLETED });
  } catch (error) {
    console.error('RAG evaluation task failed:', error);
    await updateTask(task.id, {
      status: TASK.STATUS.FAILED,
      note: `Failed: ${error.message}`
    });
  }
}

function computeAggregateMetrics(results) {
  if (!results.length) return {};

  const sum = (field) => results.reduce((acc, r) => acc + (r[field] || 0), 0) / results.length;

  const agg = {
    faithfulness: sum('faithfulness'),
    relevancy: sum('relevancy'),
    contextPrecision: sum('contextPrecision'),
    contextRecall: sum('contextRecall'),
    recallAt1: sum('recallAt1'),
    recallAt3: sum('recallAt3'),
    recallAt5: sum('recallAt5'),
    recallAt10: sum('recallAt10'),
    mrr: sum('mrr'),
    ndcgAt10: sum('ndcgAt10'),
    toolSelectionAccuracy: sum('toolSelectionAccuracy'),
    reasoningCoherence: sum('reasoningCoherence'),
    totalQuestions: results.length,
    avgDuration: sum('duration')
  };

  // Add ID-based metrics if available (some results may have them)
  const idBasedResults = results.filter(r => r.idBasedRecallAt5 !== undefined);
  if (idBasedResults.length > 0) {
    agg.idBasedRecallAt5 = idBasedResults.reduce((acc, r) => acc + r.idBasedRecallAt5, 0) / idBasedResults.length;
    agg.idBasedMrr = idBasedResults.reduce((acc, r) => acc + r.idBasedMrr, 0) / idBasedResults.length;
    agg.idBasedNdcgAt10 = idBasedResults.reduce((acc, r) => acc + r.idBasedNdcgAt10, 0) / idBasedResults.length;
  }

  return agg;
}
