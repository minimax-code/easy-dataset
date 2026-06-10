import { NextResponse } from 'next/server';
import { FeishuClient } from '@/lib/services/feishu/client';

export async function POST(request, { params }) {
  try {
    const body = await request.json();
    const { appId, appSecret, spaceId } = body;

    if (!appId || !appSecret) {
      return NextResponse.json({ error: 'Missing required fields: appId, appSecret' }, { status: 400 });
    }

    const client = new FeishuClient(appId, appSecret);
    const result = await client.testConnection();

    if (!result.success) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to test Feishu connection:', String(error));
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
