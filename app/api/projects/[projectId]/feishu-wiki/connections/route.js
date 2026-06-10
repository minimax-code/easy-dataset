import { NextResponse } from 'next/server';
import {
  getConnections,
  createConnection,
  updateConnection,
  deleteConnection
} from '@/lib/db/feishuWiki';
import { encrypt } from '@/lib/services/feishu/encryption';

function stripSecret(connection) {
  const { appSecret, ...rest } = connection;
  return rest;
}

export async function GET(request, { params }) {
  try {
    const { projectId } = params;
    if (!projectId) {
      return NextResponse.json({ error: 'Missing project ID' }, { status: 400 });
    }
    const connections = await getConnections(projectId);
    const data = connections.map(stripSecret);
    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error('Failed to get Feishu wiki connections:', String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { projectId } = params;
    const body = await request.json();
    const { name, appId, appSecret, spaceId, spaceName } = body;

    if (!name || !appId || !appSecret || !spaceId) {
      return NextResponse.json({ error: 'Missing required fields: name, appId, appSecret, spaceId' }, { status: 400 });
    }

    const encrypted = encrypt(appSecret);
    const connection = await createConnection({
      projectId,
      name,
      appId,
      appSecret: encrypted,
      spaceId,
      spaceName,
      status: 0
    });

    return NextResponse.json(stripSecret(connection), { status: 201 });
  } catch (error) {
    console.error('Failed to create Feishu wiki connection:', String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { id, name, appId, appSecret, spaceId, spaceName } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing connection ID' }, { status: 400 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (appId !== undefined) updateData.appId = appId;
    if (appSecret !== undefined) updateData.appSecret = encrypt(appSecret);
    if (spaceId !== undefined) updateData.spaceId = spaceId;
    if (spaceName !== undefined) updateData.spaceName = spaceName;

    const connection = await updateConnection(id, updateData);
    return NextResponse.json(stripSecret(connection));
  } catch (error) {
    console.error('Failed to update Feishu wiki connection:', String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Missing ids array' }, { status: 400 });
    }

    let deleted = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await deleteConnection(id);
        deleted++;
      } catch (err) {
        console.error(`Failed to delete connection ${id}:`, String(err));
        failed++;
      }
    }

    return NextResponse.json({ deleted, failed });
  } catch (error) {
    console.error('Failed to delete Feishu wiki connections:', String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
