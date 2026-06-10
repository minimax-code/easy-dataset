import { NextResponse } from 'next/server';
import { getDocuments } from '@/lib/db/feishuWiki';

export async function GET(request, { params }) {
  try {
    const { connectionId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const result = await getDocuments(connectionId, { page, pageSize });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get Feishu wiki documents:', String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
