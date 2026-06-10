import { NextResponse } from 'next/server';
import { getDocumentsByIds } from '@/lib/db/feishuWiki';
import { getConnectionById } from '@/lib/db/feishuWiki';
import { processTask } from '@/lib/services/tasks';
import { db } from '@/lib/db/index';

export async function POST(request, { params }) {
  try {
    const { projectId, connectionId } = params;
    const body = await request.json();
    const { documentIds = [], domainTreeAction = 'keep' } = body;

    if (!documentIds.length) {
      return NextResponse.json({ error: 'No document IDs provided' }, { status: 400 });
    }

    // Verify connection exists
    const connection = await getConnectionById(connectionId);
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Verify documents exist
    const docs = await getDocumentsByIds(documentIds);
    if (!docs.length) {
      return NextResponse.json({ error: 'No valid documents found' }, { status: 400 });
    }

    // Create background task
    const task = await db.task.create({
      data: {
        taskType: 'feishu-wiki-process',
        projectId,
        status: 0,
        startTime: new Date(),
        modelInfo: JSON.stringify({ connectionId }),
        detail: `Processing ${docs.length} Feishu Wiki documents`,
        note: JSON.stringify({
          documentIds,
          connectionId,
          domainTreeAction
        })
      }
    });

    // Process in background
    processTask(task.id).catch(err => {
      console.error(`Feishu wiki process task failed: ${task.id}`, String(err));
    });

    return NextResponse.json({
      taskId: task.id,
      status: 'processing',
      documentCount: docs.length,
      message: 'Document processing started'
    });
  } catch (error) {
    console.error('Failed to start Feishu wiki process:', String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
