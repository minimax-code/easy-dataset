import { NextResponse } from 'next/server';
import { deleteChunkById, getChunkByFileIds, getChunkById, getChunksByFileIds, updateChunkById, getChunkByProjectId } from '@/lib/db/chunks';

// 获取文本块内容
export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    // 验证参数
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID cannot be empty' }, { status: 400 });
    }
    const body = await request.json();
    const fileIds = body.fileIds || body.array || [];

    // 如果传入空数组，返回项目中所有chunks
    if (!fileIds || fileIds.length === 0) {
      const chunks = await getChunkByProjectId(projectId);
      return NextResponse.json({ data: chunks });
    }

    // 获取指定文件的文本块内容
    const chunks = await getChunksByFileIds(fileIds);

    return NextResponse.json({ data: chunks });
  } catch (error) {
    console.error('Failed to get text block content:', String(error));
    return NextResponse.json({ error: String(error) || 'Failed to get text block content' }, { status: 500 });
  }
}
