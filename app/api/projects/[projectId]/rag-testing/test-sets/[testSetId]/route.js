import { NextResponse } from 'next/server';
import { getTestSetById, updateTestSet, deleteTestSet } from '@/lib/db/ragTestSets';

export async function GET(request, { params }) {
  try {
    const { testSetId } = await params;
    const testSet = await getTestSetById(testSetId);
    if (!testSet) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(testSet);
  } catch (error) {
    console.error('Failed to get test set:', error);
    return NextResponse.json({ error: 'Failed to get test set' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { testSetId } = await params;
    const body = await request.json();
    const testSet = await updateTestSet(testSetId, body);
    return NextResponse.json(testSet);
  } catch (error) {
    console.error('Failed to update test set:', error);
    return NextResponse.json({ error: 'Failed to update test set' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { testSetId } = await params;
    await deleteTestSet(testSetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete test set:', error);
    return NextResponse.json({ error: 'Failed to delete test set' }, { status: 500 });
  }
}
