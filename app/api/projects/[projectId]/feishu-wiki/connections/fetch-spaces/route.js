import { NextResponse } from 'next/server';
import { FeishuClient } from '@/lib/services/feishu/client';

export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const { appId, appSecret } = body;

    if (!appId || !appSecret) {
      return NextResponse.json({ error: 'Missing required fields: appId, appSecret' }, { status: 400 });
    }

    const client = new FeishuClient(appId, appSecret);
    const spaces = await client.listSpaces();

    return NextResponse.json({ spaces });
  } catch (error) {
    console.error('Failed to fetch Feishu spaces:', String(error));
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
