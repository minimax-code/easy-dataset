import { NextResponse } from 'next/server';
import { getEndpoints, createEndpoint, updateEndpoint, deleteEndpoint, updateEndpointStatus } from '@/lib/db/ragEndpoints';
import { createRAGClient } from '@/lib/services/rag-testing/endpoint-client';

export async function GET(request, { params }) {
  try {
    const { projectId } = await params;
    const endpoints = await getEndpoints(projectId);
    return NextResponse.json(endpoints);
  } catch (error) {
    console.error('Failed to get endpoints:', error);
    return NextResponse.json({ error: 'Failed to get endpoints' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const endpoint = await createEndpoint({
      projectId,
      name: body.name,
      baseUrl: body.baseUrl,
      endpointType: body.endpointType,
      authConfig: JSON.stringify(body.authConfig || {}),
      requestMapping: JSON.stringify(body.requestMapping || {}),
      responseMapping: JSON.stringify(body.responseMapping || {}),
      tokenMapping: JSON.stringify(body.tokenMapping || {})
    });
    return NextResponse.json(endpoint);
  } catch (error) {
    console.error('Failed to create endpoint:', error);
    return NextResponse.json({ error: 'Failed to create endpoint' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing endpoint id' }, { status: 400 });

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.baseUrl !== undefined) updateData.baseUrl = data.baseUrl;
    if (data.endpointType !== undefined) updateData.endpointType = data.endpointType;
    if (data.authConfig !== undefined) updateData.authConfig = JSON.stringify(data.authConfig);
    if (data.requestMapping !== undefined) updateData.requestMapping = JSON.stringify(data.requestMapping);
    if (data.responseMapping !== undefined) updateData.responseMapping = JSON.stringify(data.responseMapping);
    if (data.tokenMapping !== undefined) updateData.tokenMapping = JSON.stringify(data.tokenMapping);

    const endpoint = await updateEndpoint(id, updateData);
    return NextResponse.json(endpoint);
  } catch (error) {
    console.error('Failed to update endpoint:', error);
    return NextResponse.json({ error: 'Failed to update endpoint' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { ids } = await request.json();
    const results = { deleted: 0, failed: 0 };
    await Promise.all(
      ids.map(id =>
        deleteEndpoint(id)
          .then(() => results.deleted++)
          .catch(() => results.failed++)
      )
    );
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to delete endpoints:', error);
    return NextResponse.json({ error: 'Failed to delete endpoints' }, { status: 500 });
  }
}
