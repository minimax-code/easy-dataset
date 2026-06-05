import { NextResponse } from 'next/server';
import { getEvalRunById } from '@/lib/db/ragEvalResults';

export async function GET(request, { params }) {
  try {
    const { projectId } = await params;
    const url = new URL(request.url);
    const runAId = url.searchParams.get('runA');
    const runBId = url.searchParams.get('runB');

    if (!runAId || !runBId) {
      return NextResponse.json({ error: 'runA and runB query params required' }, { status: 400 });
    }

    const [runA, runB] = await Promise.all([
      getEvalRunById(runAId),
      getEvalRunById(runBId)
    ]);

    if (!runA || !runB) {
      return NextResponse.json({ error: 'One or both runs not found' }, { status: 404 });
    }

    const metricsA = typeof runA.aggregateMetrics === 'string' ? JSON.parse(runA.aggregateMetrics || '{}') : runA.aggregateMetrics || {};
    const metricsB = typeof runB.aggregateMetrics === 'string' ? JSON.parse(runB.aggregateMetrics || '{}') : runB.aggregateMetrics || {};

    // Compute deltas
    const metricKeys = ['faithfulness', 'relevancy', 'contextPrecision', 'contextRecall', 'recallAt1', 'recallAt3', 'recallAt5', 'recallAt10', 'mrr', 'ndcgAt10', 'toolSelectionAccuracy', 'reasoningCoherence'];
    const comparison = metricKeys.map(key => ({
      metric: key,
      runA: metricsA[key] || 0,
      runB: metricsB[key] || 0,
      delta: (metricsB[key] || 0) - (metricsA[key] || 0)
    }));

    // Per-question deltas
    const resultsA = runA.results || [];
    const resultsB = runB.results || [];
    const questionDeltas = [];
    const bMap = new Map(resultsB.map(r => [r.questionId, r]));

    for (const ra of resultsA) {
      const rb = bMap.get(ra.questionId);
      if (rb) {
        questionDeltas.push({
          questionId: ra.questionId,
          question: ra.testQuestion?.question || ra.questionId,
          faithfulness: { a: ra.faithfulness, b: rb.faithfulness, delta: rb.faithfulness - ra.faithfulness },
          relevancy: { a: ra.relevancy, b: rb.relevancy, delta: rb.relevancy - ra.relevancy },
          contextPrecision: { a: ra.contextPrecision, b: rb.contextPrecision, delta: rb.contextPrecision - ra.contextPrecision }
        });
      }
    }

    return NextResponse.json({
      runA: { id: runA.id, name: runA.name, metrics: metricsA },
      runB: { id: runB.id, name: runB.name, metrics: metricsB },
      comparison,
      questionDeltas
    });
  } catch (error) {
    console.error('Failed to compare evaluations:', error);
    return NextResponse.json({ error: 'Failed to compare evaluations' }, { status: 500 });
  }
}