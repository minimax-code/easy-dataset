'use server';
import { db } from '@/lib/db/index';

// Eval Runs
export async function getEvalRuns(projectId, { page = 1, pageSize = 20 } = {}) {
  try {
    const [data, total] = await Promise.all([
      db.rAGEvalRuns.findMany({
        where: { projectId },
        include: {
          endpoint: { select: { id: true, name: true } },
          testSet: { select: { id: true, name: true } },
          task: { select: { id: true, status: true, completedCount: true, totalCount: true } }
        },
        orderBy: { createAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.rAGEvalRuns.count({ where: { projectId } })
    ]);
    return { data, total, page, pageSize };
  } catch (error) {
    console.error('Failed to get eval runs:', error);
    throw error;
  }
}

export async function getEvalRunById(evalRunId) {
  try {
    return await db.rAGEvalRuns.findUnique({
      where: { id: evalRunId },
      include: {
        endpoint: true,
        testSet: { include: { questions: true } },
        task: true,
        results: {
          include: { testQuestion: true },
          orderBy: { createAt: 'asc' }
        }
      }
    });
  } catch (error) {
    console.error('Failed to get eval run by id:', error);
    throw error;
  }
}

export async function createEvalRun(data) {
  try {
    return await db.rAGEvalRuns.create({ data });
  } catch (error) {
    console.error('Failed to create eval run:', error);
    throw error;
  }
}

export async function updateEvalRun(evalRunId, data) {
  try {
    return await db.rAGEvalRuns.update({ where: { id: evalRunId }, data });
  } catch (error) {
    console.error('Failed to update eval run:', error);
    throw error;
  }
}

export async function deleteEvalRun(evalRunId) {
  try {
    return await db.rAGEvalRuns.delete({ where: { id: evalRunId } });
  } catch (error) {
    console.error('Failed to delete eval run:', error);
    throw error;
  }
}

// Eval Results
export async function getEvalResults(evalRunId, { page = 1, pageSize = 50 } = {}) {
  try {
    const [data, total] = await Promise.all([
      db.rAGEvalResults.findMany({
        where: { evalRunId },
        include: { testQuestion: true },
        orderBy: { createAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.rAGEvalResults.count({ where: { evalRunId } })
    ]);
    return { data, total, page, pageSize };
  } catch (error) {
    console.error('Failed to get eval results:', error);
    throw error;
  }
}

export async function createEvalResult(data) {
  try {
    return await db.rAGEvalResults.create({ data });
  } catch (error) {
    console.error('Failed to create eval result:', error);
    throw error;
  }
}

export async function updateEvalResult(id, data) {
  try {
    return await db.rAGEvalResults.update({ where: { id }, data });
  } catch (error) {
    console.error('Failed to update eval result:', error);
    throw error;
  }
}

// Agent Traces
export async function createTrace(data) {
  try {
    return await db.rAGAgentTraces.create({ data });
  } catch (error) {
    console.error('Failed to create trace:', error);
    throw error;
  }
}

export async function getTraceByEvalResultId(evalResultId) {
  try {
    return await db.rAGAgentTraces.findUnique({ where: { evalResultId } });
  } catch (error) {
    console.error('Failed to get trace:', error);
    throw error;
  }
}
