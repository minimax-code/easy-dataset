import { NextResponse } from 'next/server';
import { getEvalRunById, getEvalResults } from '@/lib/db/ragEvalResults';

export async function GET(request, { params }) {
  try {
    const { evaluationId } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    const evalRun = await getEvalRunById(evaluationId);
    if (!evalRun) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: results } = await getEvalResults(evaluationId, { page: 1, pageSize: 10000 });
    const metrics = typeof evalRun.aggregateMetrics === 'string' ? JSON.parse(evalRun.aggregateMetrics || '{}') : evalRun.aggregateMetrics || {};

    if (format === 'csv') {
      const headers = ['questionId', 'question', 'agentAnswer', 'faithfulness', 'relevancy', 'contextPrecision', 'contextRecall', 'recallAt1', 'recallAt3', 'recallAt5', 'recallAt10', 'mrr', 'ndcgAt10', 'duration', 'status'];
      const rows = results.map(r => [
        r.questionId,
        `"${(r.testQuestion?.question || '').replace(/"/g, '""')}"`,
        `"${(r.agentAnswer || '').replace(/"/g, '""')}"`,
        r.faithfulness,
        r.relevancy,
        r.contextPrecision,
        r.contextRecall,
        r.recallAt1,
        r.recallAt3,
        r.recallAt5,
        r.recallAt10,
        r.mrr,
        r.ndcgAt10,
        r.duration,
        r.status
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      return new NextResponse(csv, {
        headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="eval-${evaluationId}.csv"` }
      });
    }

    if (format === 'jsonl') {
      const lines = results.map(r => JSON.stringify({
        questionId: r.questionId,
        question: r.testQuestion?.question,
        agentAnswer: r.agentAnswer,
        faithfulness: r.faithfulness,
        relevancy: r.relevancy,
        contextPrecision: r.contextPrecision,
        contextRecall: r.contextRecall,
        mrr: r.mrr,
        ndcgAt10: r.ndcgAt10
      }));
      return new NextResponse(lines.join('\n'), {
        headers: { 'Content-Type': 'application/x-ndjson', 'Content-Disposition': `attachment; filename="eval-${evaluationId}.jsonl"` }
      });
    }

    if (format === 'md') {
      let md = `# Evaluation Report: ${evalRun.name}\n\n`;
      md += `**Agent**: ${evalRun.endpoint?.name || 'Unknown'}\n`;
      md += `**Date**: ${evalRun.createAt}\n`;
      md += `**Questions**: ${results.length}\n\n`;
      md += `## Aggregate Metrics\n\n`;
      md += `| Metric | Score |\n|--------|-------|\n`;
      for (const [key, value] of Object.entries(metrics)) {
        if (typeof value === 'number') md += `| ${key} | ${value.toFixed(3)} |\n`;
      }
      md += `\n## Per-Question Results\n\n`;
      for (const r of results) {
        md += `### ${r.testQuestion?.question || r.questionId}\n\n`;
        md += `- **Agent Answer**: ${r.agentAnswer?.slice(0, 200) || 'N/A'}\n`;
        md += `- **Faithfulness**: ${r.faithfulness.toFixed(2)}\n`;
        md += `- **Relevancy**: ${r.relevancy.toFixed(2)}\n`;
        md += `- **MRR**: ${r.mrr.toFixed(2)} | **NDCG@10**: ${r.ndcgAt10.toFixed(2)}\n\n`;
      }
      return new NextResponse(md, {
        headers: { 'Content-Type': 'text/markdown', 'Content-Disposition': `attachment; filename="eval-${evaluationId}.md"` }
      });
    }

    // Default: JSON
    return new NextResponse(JSON.stringify({ evalRun, metrics, results }, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="eval-${evaluationId}.json"` }
    });
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}