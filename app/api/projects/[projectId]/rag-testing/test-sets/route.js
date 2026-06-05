import { NextResponse } from 'next/server';
import { getTestSets, createTestSet, deleteTestSet, createQuestions } from '@/lib/db/ragTestSets';

export async function GET(request, { params }) {
  try {
    const { projectId } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const result = await getTestSets(projectId, { page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get test sets:', error);
    return NextResponse.json({ error: 'Failed to get test sets' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const testSet = await createTestSet({
      projectId,
      name: body.name,
      description: body.description || '',
      tags: body.tags || ''
    });

    // Bulk import questions if provided
    if (body.questions && Array.isArray(body.questions) && body.questions.length > 0) {
      await createQuestions(
        body.questions.map(q => ({
          testSetId: testSet.id,
          question: q.question,
          referenceAnswer: q.referenceAnswer || '',
          chunkId: q.chunkId || null,
          relevantChunkIds: JSON.stringify(q.relevantChunkIds || []),
          status: q.status || 1
        }))
      );
    }

    return NextResponse.json(testSet);
  } catch (error) {
    console.error('Failed to create test set:', error);
    return NextResponse.json({ error: 'Failed to create test set' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { ids } = await request.json();
    const results = { deleted: 0, failed: 0 };
    await Promise.all(
      ids.map(id =>
        deleteTestSet(id)
          .then(() => results.deleted++)
          .catch(() => results.failed++)
      )
    );
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to delete test sets:', error);
    return NextResponse.json({ error: 'Failed to delete test sets' }, { status: 500 });
  }
}
