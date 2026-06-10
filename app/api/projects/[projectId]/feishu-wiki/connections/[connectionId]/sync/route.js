import { NextResponse } from 'next/server';
import { getConnectionById } from '@/lib/db/feishuWiki';
import { processTask } from '@/lib/services/tasks';
import { db } from '@/lib/db/index';

export async function POST(request, { params }) {
  try {
    const { projectId, connectionId } = params;

    // Verify the connection exists
    const connection = await getConnectionById(connectionId);
    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Create a sync task record
    const task = await db.task.create({
      data: {
        taskType: 'feishu-wiki-sync',
        projectId,
        status: 0,
        startTime: new Date(),
        modelInfo: JSON.stringify({ connectionId }),
        detail: `Syncing Feishu Wiki: ${connection.spaceName}`,
        note: connectionId
      }
    });

    // Process the task in the background (don't await)
    processTask(task.id).catch(err => {
      console.error(`Feishu wiki sync task failed: ${task.id}`, String(err));
    });

    return NextResponse.json({
      taskId: task.id,
      status: 'processing',
      message: 'Sync started'
    });
  } catch (error) {
    console.error('Failed to start Feishu wiki sync:', String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
