/**
 * 任务恢复服务
 * 用于在服务启动时检查并恢复未完成的任务
 */
import { PrismaClient } from '@prisma/client';
import { processAnswerGenerationTask } from './answer-generation';
import { processQuestionGenerationTask } from './question-generation';
import { processRagEvaluationTask } from './rag-evaluation';
import { processRagTestsetGenerationTask } from './rag-testset-generation';
import { processFeishuWikiSyncTask } from './feishu-wiki-sync';
import { processFeishuWikiProcessTask } from './feishu-wiki-process';

const prisma = new PrismaClient();

// 服务初始化标志，确保只执行一次
let initialized = false;

/**
 * 恢复未完成的任务
 * 在应用启动时自动执行一次
 */
export async function recoverPendingTasks() {
  // 如果已经初始化过，直接返回
  if (process.env.INITED) {
    return;
  }

  process.env.INITED = true;

  try {
    console.log('Checking unfinished tasks...');

    // 查找所有处理中的任务
    const pendingTasks = await prisma.task.findMany({
      where: {
        status: 0 // 处理中的任务
      }
    });

    if (pendingTasks.length === 0) {
      console.log('No tasks to recover');
      initialized = true;
      return;
    }

    console.log(`Found ${pendingTasks.length} unfinished tasks, recovering...`);

    // 遍历处理每个任务
    for (const task of pendingTasks) {
      try {
        // 根据任务类型调用对应的处理函数
        switch (task.taskType) {
          case 'question-generation':
            // 异步处理，不等待完成
            processQuestionGenerationTask(task).catch(error => {
              console.error(`Failed to recover question generation task ${task.id}:`, error);
            });
            break;
          case 'answer-generation':
            // 异步处理，不等待完成
            processAnswerGenerationTask(task).catch(error => {
              console.error(`Failed to recover answer generation task ${task.id}:`, error);
            });
            break;
          case 'rag-evaluation':
            processRagEvaluationTask(task).catch(error => {
              console.error(`Failed to recover rag evaluation task ${task.id}:`, error);
            });
            break;
          case 'rag-testset-generation':
            processRagTestsetGenerationTask(task).catch(error => {
              console.error(`Failed to recover rag testset generation task ${task.id}:`, error);
            });
            break;
          case 'feishu-wiki-sync':
            processFeishuWikiSyncTask(task).catch(error => {
              console.error(`Failed to recover feishu wiki sync task ${task.id}:`, error);
            });
            break;
          case 'feishu-wiki-process':
            processFeishuWikiProcessTask(task).catch(error => {
              console.error(`Failed to recover feishu wiki process task ${task.id}:`, error);
            });
            break;
          default:
            console.warn(`Other Task: ${task.taskType}`);
            await prisma.task.update({
              where: { id: task.id },
              data: {
                status: 2,
                detail: `${task.taskType} Error`,
                note: `${task.taskType} Error`,
                endTime: new Date()
              }
            });
        }
      } catch (error) {
        console.error(`Failed to recover task ${task.id}:`, error);
      }
    }

    console.log('Task recovery started; unfinished tasks will continue in the background');
    initialized = true;
  } catch (error) {
    console.error('Task recovery error:', error);
    // 即使出错也标记为已初始化，避免反复尝试
    initialized = true;
  }
}

// 在模块加载时自动执行恢复
recoverPendingTasks().catch(error => {
  console.error('Failed to run task recovery:', error);
});
