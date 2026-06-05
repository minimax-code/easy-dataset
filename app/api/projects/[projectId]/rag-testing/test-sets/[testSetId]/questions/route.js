import { NextResponse } from 'next/server';
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  approveAllQuestions,
  getQuestionStats
} from '@/lib/db/ragTestSets';
import { PrismaClient } from '@prisma/client';
import { TASK } from '@/constant';
import { processTask } from '@/lib/services/tasks/index';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { testSetId } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const status = url.searchParams.get('status');
    const statsOnly = url.searchParams.get('stats');

    if (statsOnly === 'true') {
      const stats = await getQuestionStats(testSetId);
      return NextResponse.json(stats);
    }

    const filter = {};
    if (status !== null && status !== undefined && status !== '') filter.status = parseInt(status);

    const result = await getQuestions(testSetId, { page, pageSize, ...filter });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get questions:', error);
    return NextResponse.json({ error: 'Failed to get questions' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { testSetId, projectId } = await params;
    const body = await request.json();

    // Generate from chunks via LLM task
    if (body.action === 'generate' && body.chunkIds) {
      const task = await prisma.task.create({
        data: {
          projectId,
          taskType: 'rag-testset-generation',
          status: TASK.STATUS.PROCESSING,
          detail: JSON.stringify({
            testSetId,
            chunkIds: body.chunkIds,
            modelConfigId: body.modelConfigId
          }),
          modelInfo: body.modelConfigId || '',
          completedCount: 0,
          totalCount: body.chunkIds.length
        }
      });

      processTask(task.id).catch(err => console.error('Task processing failed:', err));
      return NextResponse.json({ taskId: task.id });
    }

    // Single question create
    const question = await createQuestion({
      testSetId,
      question: body.question,
      referenceAnswer: body.referenceAnswer || '',
      chunkId: body.chunkId || null,
      relevantChunkIds: JSON.stringify(body.relevantChunkIds || []),
      status: body.status || 0
    });
    return NextResponse.json(question);
  } catch (error) {
    console.error('Failed to create question:', error);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();

    // Approve all
    if (body.action === 'approveAll') {
      const { testSetId } = await params;
      await approveAllQuestions(testSetId);
      return NextResponse.json({ success: true });
    }

    // Update single question
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing question id' }, { status: 400 });
    const question = await updateQuestion(id, data);
    return NextResponse.json(question);
  } catch (error) {
    console.error('Failed to update question:', error);
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { ids } = await request.json();
    const results = { deleted: 0, failed: 0 };
    await Promise.all(
      ids.map(id =>
        deleteQuestion(id)
          .then(() => results.deleted++)
          .catch(() => results.failed++)
      )
    );
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to delete questions:', error);
    return NextResponse.json({ error: 'Failed to delete questions' }, { status: 500 });
  }
}
