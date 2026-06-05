import { NextResponse } from 'next/server';
import { getEndpointById, updateEndpointStatus } from '@/lib/db/ragEndpoints';
import { createRAGClient } from '@/lib/services/rag-testing/endpoint-client';

export async function POST(request, { params }) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    let endpointConfig;

    if (body.endpointId) {
      // Test existing saved endpoint
      const endpoint = await getEndpointById(body.endpointId);
      if (!endpoint) {
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
      }
      if (endpoint.projectId !== projectId) {
        return NextResponse.json({ error: 'Endpoint does not belong to this project' }, { status: 403 });
      }
      endpointConfig = endpoint;
    } else {
      // Test unsaved config from dialog form
      endpointConfig = {
        endpointType: body.endpointType,
        baseUrl: body.baseUrl,
        authConfig: body.authConfig || {},
        requestMapping: body.requestMapping || {},
        responseMapping: body.responseMapping || {},
        tokenMapping: body.tokenMapping || {}
      };
    }

    if (!endpointConfig.baseUrl) {
      return NextResponse.json({ error: 'Base URL is required' }, { status: 400 });
    }

    const client = createRAGClient(endpointConfig);
    const result = await client.testConnection();

    // Update status in DB if testing a saved endpoint
    if (body.endpointId && result.success !== undefined) {
      await updateEndpointStatus(body.endpointId, result.success ? 1 : 2);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Test connection failed:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Test connection failed' },
      { status: 500 }
    );
  }
}
