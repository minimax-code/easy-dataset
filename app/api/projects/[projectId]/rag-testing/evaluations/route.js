import { NextResponse } from 'next/server';
import { getEvalRuns, createEvalRun } from '@/lib/db/ragEvalResults';
import { PrismaClient } from '@prisma/client';
import { TASK } from '@/constant';
import { processTask } from '@/lib/services/tasks/index';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    const { projectId } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const result = await getEvalRuns(projectId, { page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get eval runs:', error);
    return NextResponse.json({ error: 'Failed to get eval runs' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    // Create Task first
    const task = await prisma.task.create({
      data: {
        projectId,
        taskType: 'rag-evaluation',
        status: TASK.STATUS.PROCESSING,
        detail: JSON.stringify({
          evalRunId: '' // will be set after eval run creation
        }),
        modelInfo: body.judgeModelId || '',
        completedCount: 0,
        totalCount: 0
      }
    });

    // Create EvalRun
    const evalRun = await createEvalRun({
      projectId,
      taskId: task.id,
      endpointId: body.endpointId,
      testSetId: body.testSetId,
      judgeModelId: body.judgeModelId || null,
      evalOptions: JSON.stringify(body.evalOptions || {}),
      aggregateMetrics: '{}',
      name: body.name || `Eval #${task.id.slice(0, 6)}`
    });

    // Update task detail with evalRunId
    await prisma.task.update({
      where: { id: task.id },
      data: {
        detail: JSON.stringify({ evalRunId: evalRun.id }),
        totalCount: 0 // will be updated by processor
      }
    });

    // Start processing
    processTask(task.id).catch(err => console.error('Task processing failed:', err));

    return NextResponse.json({ taskId: task.id, evalRunId: evalRun.id });
  } catch (error) {
    console.error('Failed to create eval run:', error);
    return NextResponse.json({ error: 'Failed to create eval run' }, { status: 500 });
  }
}