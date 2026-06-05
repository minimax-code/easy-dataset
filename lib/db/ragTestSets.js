'use server';
import { db } from '@/lib/db/index';

export async function getTestSets(projectId, { page = 1, pageSize = 20 } = {}) {
  try {
    const [data, total] = await Promise.all([
      db.rAGTestSets.findMany({
        where: { projectId },
        include: { _count: { select: { questions: true, evalRuns: true } } },
        orderBy: { createAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.rAGTestSets.count({ where: { projectId } })
    ]);
    return { data, total, page, pageSize };
  } catch (error) {
    console.error('Failed to get RAG test sets:', error);
    throw error;
  }
}

export async function getTestSetById(testSetId) {
  try {
    return await db.rAGTestSets.findUnique({
      where: { id: testSetId },
      include: { _count: { select: { questions: true } } }
    });
  } catch (error) {
    console.error('Failed to get test set by id:', error);
    throw error;
  }
}

export async function createTestSet(data) {
  try {
    return await db.rAGTestSets.create({ data });
  } catch (error) {
    console.error('Failed to create test set:', error);
    throw error;
  }
}

export async function updateTestSet(testSetId, data) {
  try {
    return await db.rAGTestSets.update({ where: { id: testSetId }, data });
  } catch (error) {
    console.error('Failed to update test set:', error);
    throw error;
  }
}

export async function deleteTestSet(testSetId) {
  try {
    return await db.rAGTestSets.delete({ where: { id: testSetId } });
  } catch (error) {
    console.error('Failed to delete test set:', error);
    throw error;
  }
}

// Questions
export async function getQuestions(testSetId, { page = 1, pageSize = 50, status } = {}) {
  try {
    const where = { testSetId };
    if (status !== undefined) where.status = status;
    const [data, total] = await Promise.all([
      db.rAGTestQuestions.findMany({
        where,
        orderBy: { createAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.rAGTestQuestions.count({ where })
    ]);
    return { data, total, page, pageSize };
  } catch (error) {
    console.error('Failed to get test questions:', error);
    throw error;
  }
}

export async function createQuestion(data) {
  try {
    return await db.rAGTestQuestions.create({ data });
  } catch (error) {
    console.error('Failed to create test question:', error);
    throw error;
  }
}

export async function createQuestions(questions) {
  try {
    return await db.rAGTestQuestions.createMany({ data: questions });
  } catch (error) {
    console.error('Failed to create test questions:', error);
    throw error;
  }
}

export async function updateQuestion(id, data) {
  try {
    return await db.rAGTestQuestions.update({ where: { id }, data });
  } catch (error) {
    console.error('Failed to update test question:', error);
    throw error;
  }
}

export async function deleteQuestion(id) {
  try {
    return await db.rAGTestQuestions.delete({ where: { id } });
  } catch (error) {
    console.error('Failed to delete test question:', error);
    throw error;
  }
}

export async function approveQuestion(id) {
  return updateQuestion(id, { status: 1 });
}

export async function approveAllQuestions(testSetId) {
  try {
    return await db.rAGTestQuestions.updateMany({
      where: { testSetId, status: 0 },
      data: { status: 1 }
    });
  } catch (error) {
    console.error('Failed to approve all questions:', error);
    throw error;
  }
}

export async function getQuestionStats(testSetId) {
  try {
    const [total, approved, draft] = await Promise.all([
      db.rAGTestQuestions.count({ where: { testSetId } }),
      db.rAGTestQuestions.count({ where: { testSetId, status: 1 } }),
      db.rAGTestQuestions.count({ where: { testSetId, status: 0 } })
    ]);
    return { total, approved, draft };
  } catch (error) {
    console.error('Failed to get question stats:', error);
    throw error;
  }
}
