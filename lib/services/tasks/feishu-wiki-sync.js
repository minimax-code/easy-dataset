/**
 * Feishu Wiki document sync task processor
 * Syncs all documents from a Feishu Wiki space into the local database
 */

import { TASK } from '@/constant';
import { updateTask } from './index';
import { getConnectionById, updateConnectionSyncTime, upsertDocument, createSyncLog, updateSyncLog } from '@/lib/db/feishuWiki';
import { FeishuClient } from '@/lib/services/feishu/client';
import { decrypt } from '@/lib/services/feishu/encryption';

const FETCH_DELAY_MS = 200;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process a Feishu Wiki sync task
 * @param {Object} task - Task object from the database
 */
export async function processFeishuWikiSyncTask(task) {
  let syncLogId = null;
  let syncedCount = 0;
  let failedCount = 0;

  try {
    console.log(`Starting Feishu Wiki sync task: ${task.id}`);

    // Extract connectionId from modelInfo (JSON) or note (direct string)
    let connectionId = task.note;
    if (!connectionId) {
      try {
        const modelInfo = JSON.parse(task.modelInfo || '{}');
        connectionId = modelInfo.connectionId;
      } catch (e) {
        // ignore parse error
      }
    }

    if (!connectionId) {
      throw new Error('Missing connectionId in task');
    }

    // Fetch connection from DB
    const connection = await getConnectionById(connectionId);
    if (!connection) {
      throw new Error(`Feishu Wiki connection not found: ${connectionId}`);
    }

    // Create a sync log entry
    const syncLog = await createSyncLog({
      connectionId,
      status: 0,
      totalNodes: 0,
      syncedNodes: 0,
      failedNodes: 0,
      startedAt: new Date()
    });
    syncLogId = syncLog.id;

    // Update task status to PROCESSING
    await updateTask(task.id, {
      status: TASK.STATUS.PROCESSING,
      startTime: new Date(),
      detail: JSON.stringify({ connectionId, syncLogId, stepInfo: 'Starting sync...' })
    });

    // Decrypt the app secret
    const decryptedSecret = decrypt(connection.appSecret);

    // Create Feishu client
    const client = new FeishuClient(connection.appId, decryptedSecret);

    // Count total nodes first
    let totalNodes = 0;

    // Iterate through all wiki nodes
    for await (const node of client.walkWikiNodes(connection.spaceId)) {
      totalNodes++;
      const objType = node.obj_type;

      // Only process docx and doc types
      if (objType !== 'docx' && objType !== 'doc') {
        continue;
      }

      try {
        // Fetch raw document content
        const contentData = await client.getDocumentRawContent(node.node_token);
        const content = typeof contentData === 'string' ? contentData : (contentData.content || '');

        // Build folder path from node parent path or use empty string
        const folderPath = node.folderPath || '';

        // Upsert the document
        await upsertDocument({
          connectionId,
          nodeToken: node.node_token,
          title: node.title,
          content,
          folderPath,
          objType
        });

        syncedCount++;

        // Update task progress periodically
        if (syncedCount % 10 === 0) {
          await updateTask(task.id, {
            detail: JSON.stringify({
              connectionId,
              syncLogId,
              stepInfo: `Synced ${syncedCount} documents, ${failedCount} failed`,
              syncedCount,
              failedCount
            })
          });
        }

        // Small delay between fetches to respect rate limits
        await delay(FETCH_DELAY_MS);
      } catch (nodeError) {
        failedCount++;
        console.error(`Failed to sync document ${node.node_token} (${node.title}):`, nodeError.message);
      }
    }

    // Update sync log with final counts
    await updateSyncLog(syncLogId, {
      status: 1,
      totalNodes,
      syncedNodes: syncedCount,
      failedNodes: failedCount,
      completedAt: new Date()
    });

    // Update connection's lastSyncedAt
    await updateConnectionSyncTime(connectionId);

    // Update task to COMPLETED
    const resultSummary = `Sync completed: ${syncedCount} synced, ${failedCount} failed, ${totalNodes} total nodes`;

    await updateTask(task.id, {
      status: TASK.STATUS.COMPLETED,
      detail: resultSummary
    });

    console.log(`Feishu Wiki sync task completed: ${task.id}, synced: ${syncedCount}, failed: ${failedCount}`);
  } catch (error) {
    console.error(`Feishu Wiki sync task failed: ${task.id}`, error);

    // Update sync log if it was created
    if (syncLogId) {
      try {
        await updateSyncLog(syncLogId, {
          status: 2,
          syncedNodes: syncedCount,
          failedNodes: failedCount,
          completedAt: new Date(),
          errors: JSON.stringify([error.message])
        });
      } catch (logError) {
        console.error('Failed to update sync log on error:', logError);
      }
    }

    // Update task to FAILED
    await updateTask(task.id, {
      status: TASK.STATUS.FAILED,
      note: `Feishu Wiki sync failed: ${error.message}`,
      detail: JSON.stringify({ syncedCount, failedCount, error: error.message })
    });
  }
}

export default { processFeishuWikiSyncTask };
