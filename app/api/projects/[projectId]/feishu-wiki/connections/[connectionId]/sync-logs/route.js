import { NextResponse } from 'next/server';
import { getSyncLogs } from '@/lib/db/feishuWiki';

export async function GET(request, { params }) {
  try {
    const { connectionId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const result = await getSyncLogs(connectionId, { page, pageSize });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get Feishu wiki sync logs:', String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
