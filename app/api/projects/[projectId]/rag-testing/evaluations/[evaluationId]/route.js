import { NextResponse } from 'next/server';
import { getEvalRunById, deleteEvalRun } from '@/lib/db/ragEvalResults';

export async function GET(request, { params }) {
  try {
    const { evaluationId } = await params;
    const evalRun = await getEvalRunById(evaluationId);
    if (!evalRun) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(evalRun);
  } catch (error) {
    console.error('Failed to get eval run:', error);
    return NextResponse.json({ error: 'Failed to get eval run' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { evaluationId } = await params;
    await deleteEvalRun(evaluationId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete eval run:', error);
    return NextResponse.json({ error: 'Failed to delete eval run' }, { status: 500 });
  }
}