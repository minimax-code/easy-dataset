import { NextResponse } from 'next/server';
import { getEvalResults } from '@/lib/db/ragEvalResults';

export async function GET(request, { params }) {
  try {
    const { evaluationId } = await params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
    const result = await getEvalResults(evaluationId, { page, pageSize });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get eval results:', error);
    return NextResponse.json({ error: 'Failed to get eval results' }, { status: 500 });
  }
}