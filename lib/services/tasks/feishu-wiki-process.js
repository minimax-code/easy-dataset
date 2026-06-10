/**
 * Feishu Wiki document process task
 * Converts selected Feishu Wiki documents into project files and splits them into chunks
 */

import { TASK } from '@/constant';
import { updateTask } from './index';
import { getDocumentById } from '@/lib/db/feishuWiki';
import { createUploadFileInfo } from '@/lib/db/upload-files';
import { splitProjectFile } from '@/lib/file/text-splitter';
import { getProject } from '@/lib/db/projects';
import { getProjectRoot, ensureDir } from '@/lib/db/base';
import path from 'path';
import fs from 'fs';

function sanitizeFileName(title) {
  return (title || 'untitled')
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
}

export async function processFeishuWikiProcessTask(task) {
  const taskMessage = {
    stepInfo: '',
    processedFiles: 0,
    totalFiles: 0,
    errorList: [],
    finishedList: []
  };

  try {
    console.log(`Starting Feishu Wiki process task: ${task.id}`);

    const params = JSON.parse(task.note || '{}');
    const { documentIds = [], connectionId, domainTreeAction = 'keep' } = params;

    if (!documentIds.length) {
      throw new Error('No document IDs provided');
    }

    taskMessage.totalFiles = documentIds.length;
    taskMessage.stepInfo = `Processing ${documentIds.length} documents`;

    await updateTask(task.id, {
      status: TASK.STATUS.PROCESSING,
      startTime: new Date(),
      totalCount: documentIds.length,
      detail: JSON.stringify(taskMessage)
    });

    const projectRoot = await getProjectRoot();
    const projectPath = path.join(projectRoot, task.projectId);
    const filesDir = path.join(projectPath, 'files');
    await ensureDir(filesDir);

    const project = await getProject(task.projectId);
    let combinedToc = '';

    for (let i = 0; i < documentIds.length; i++) {
      const docId = documentIds[i];
      try {
        const doc = await getDocumentById(docId);
        if (!doc) {
          taskMessage.errorList.push(`Document not found: ${docId}`);
          continue;
        }

        const mdFileName = sanitizeFileName(doc.title) + '.md';
        const mdFilePath = path.join(filesDir, mdFileName);
        await fs.promises.writeFile(mdFilePath, doc.content || '', 'utf8');
        const stats = await fs.promises.stat(mdFilePath);

        const fileInfo = await createUploadFileInfo({
          projectId: task.projectId,
          fileName: mdFileName,
          size: stats.size,
          md5: '',
          fileExt: '.md',
          path: filesDir,
          feishuDocumentId: doc.id
        });

        const { toc, totalChunks } = await splitProjectFile(task.projectId, {
          fileName: mdFileName,
          fileId: fileInfo.id
        });

        combinedToc += toc;

        taskMessage.finishedList.push({
          documentId: doc.id,
          title: doc.title,
          fileName: mdFileName,
          fileId: fileInfo.id,
          totalChunks
        });
        taskMessage.processedFiles++;

        if (taskMessage.processedFiles % 5 === 0) {
          await updateTask(task.id, {
            completedCount: taskMessage.processedFiles,
            detail: JSON.stringify(taskMessage)
          });
        }

        console.log(`Processed Feishu doc: ${doc.title} → ${totalChunks} chunks`);
      } catch (docError) {
        taskMessage.errorList.push(`Failed to process ${docId}: ${docError.message}`);
        console.error(`Failed to process Feishu doc ${docId}:`, docError.message);
      }
    }

    // Update domain tree
    if (combinedToc && domainTreeAction !== 'keep') {
      try {
        const { handleDomainTree } = await import('@/lib/util/domain-tree');
        await handleDomainTree({
          projectId: task.projectId,
          newToc: combinedToc,
          model: JSON.parse(task.modelInfo || '{}'),
          language: task.language,
          action: domainTreeAction,
          project
        });
      } catch (domainError) {
        console.error('Domain tree update failed:', domainError.message);
        taskMessage.errorList.push(`Domain tree update failed: ${domainError.message}`);
      }
    }

    taskMessage.stepInfo = `Completed: ${taskMessage.processedFiles}/${taskMessage.totalFiles} documents processed`;
    await updateTask(task.id, {
      status: TASK.STATUS.COMPLETED,
      completedCount: taskMessage.processedFiles,
      detail: JSON.stringify(taskMessage)
    });

    console.log(`Feishu Wiki process task completed: ${task.id}, processed: ${taskMessage.processedFiles}`);
  } catch (error) {
    console.error(`Feishu Wiki process task failed: ${task.id}`, error);
    taskMessage.stepInfo = `Failed: ${error.message}`;
    await updateTask(task.id, {
      status: TASK.STATUS.FAILED,
      note: `Feishu Wiki process failed: ${error.message}`,
      detail: JSON.stringify(taskMessage)
    });
  }
}

export default { processFeishuWikiProcessTask };
