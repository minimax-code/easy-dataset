'use server';
import { db } from '@/lib/db/index';

export async function getEndpoints(projectId) {
  try {
    return await db.rAGEndpoints.findMany({
      where: { projectId },
      orderBy: { createAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to get RAG endpoints:', error);
    throw error;
  }
}

export async function getEndpointById(id) {
  try {
    return await db.rAGEndpoints.findUnique({ where: { id } });
  } catch (error) {
    console.error('Failed to get RAG endpoint by id:', error);
    throw error;
  }
}

export async function createEndpoint(data) {
  try {
    return await db.rAGEndpoints.create({ data });
  } catch (error) {
    console.error('Failed to create RAG endpoint:', error);
    throw error;
  }
}

export async function updateEndpoint(id, data) {
  try {
    return await db.rAGEndpoints.update({ where: { id }, data });
  } catch (error) {
    console.error('Failed to update RAG endpoint:', error);
    throw error;
  }
}

export async function deleteEndpoint(id) {
  try {
    return await db.rAGEndpoints.delete({ where: { id } });
  } catch (error) {
    console.error('Failed to delete RAG endpoint:', error);
    throw error;
  }
}

export async function updateEndpointStatus(id, status) {
  try {
    return await db.rAGEndpoints.update({
      where: { id },
      data: { status, lastTestedAt: new Date() }
    });
  } catch (error) {
    console.error('Failed to update endpoint status:', error);
    throw error;
  }
}
