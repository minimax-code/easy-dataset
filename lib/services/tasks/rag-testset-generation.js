/**
 * RAG test set generation task processor.
 * Iterates chunks → LLM generates question + reference answer + marks relevant chunk IDs → stores as draft.
 */
import { PrismaClient } from '@prisma/client';
import { TASK } from '@/constant';
import { updateTask } from './index';
import { createQuestions, getQuestionStats } from '@/lib/db/ragTestSets';
import { getChunkById } from '@/lib/db/chunks';
import LLMClient from '@/lib/llm/core/index';

const prisma = new PrismaClient();

export async function processRagTestsetGenerationTask(task) {
  const detail = typeof task.detail === 'string' ? JSON.parse(task.detail) : task.detail;
  const { testSetId, chunkIds, modelConfigId } = detail;

  try {
    await updateTask(task.id, { totalCount: chunkIds.length });

    const modelConfig = await prisma.modelConfig.findUnique({ where: { id: modelConfigId } });
    if (!modelConfig) throw new Error(`Model config not found: ${modelConfigId}`);

    const llmClient = new LLMClient(modelConfig);

    let completed = 0;
    const allQuestions = [];

    for (const chunkId of chunkIds) {
      try {
        const chunk = await getChunkById(chunkId);
        if (!chunk) continue;

        const prompt = `Based on the following text chunk, generate one test question and a reference answer for evaluating a RAG system.

Text chunk:
---
${chunk.content}
---

Respond in JSON format:
{
  "question": "the test question",
  "referenceAnswer": "the expected answer based on the text",
  "relevantChunkIds": ["${chunkId}"]
}`;

        const response = await llmClient.getResponse(prompt);
        let parsed;
        try {
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { question: response, referenceAnswer: '' };
        } catch {
          parsed = { question: response, referenceAnswer: '' };
        }

        allQuestions.push({
          testSetId,
          question: parsed.question || response,
          referenceAnswer: parsed.referenceAnswer || '',
          chunkId,
          relevantChunkIds: JSON.stringify(parsed.relevantChunkIds || [chunkId]),
          status: 0 // draft
        });

        completed++;
        await updateTask(task.id, { completedCount: completed });
      } catch (error) {
        console.error(`Failed to generate question for chunk ${chunkId}:`, error);
        completed++;
        await updateTask(task.id, { completedCount: completed });
      }
    }

    if (allQuestions.length > 0) {
      await createQuestions(allQuestions);
    }

    await updateTask(task.id, { status: TASK.STATUS.COMPLETED });
  } catch (error) {
    console.error('RAG testset generation task failed:', error);
    await updateTask(task.id, {
      status: TASK.STATUS.FAILED,
      note: `Failed: ${error.message}`
    });
  }
}
