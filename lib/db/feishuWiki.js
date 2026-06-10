'use server';
import { db } from '@/lib/db/index';

export async function getConnections(projectId) {
  try {
    return await db.feishuWikiConnection.findMany({
      where: { projectId },
      orderBy: { createAt: 'desc' }
    });
  } catch (error) {
    console.error('Failed to get Feishu wiki connections:', error);
    throw error;
  }
}

export async function getConnectionById(id) {
  try {
    return await db.feishuWikiConnection.findUnique({ where: { id } });
  } catch (error) {
    console.error('Failed to get Feishu wiki connection:', error);
    throw error;
  }
}

export async function createConnection(data) {
  try {
    return await db.feishuWikiConnection.create({ data });
  } catch (error) {
    console.error('Failed to create Feishu wiki connection:', error);
    throw error;
  }
}

export async function updateConnection(id, data) {
  try {
    return await db.feishuWikiConnection.update({ where: { id }, data });
  } catch (error) {
    console.error('Failed to update Feishu wiki connection:', error);
    throw error;
  }
}

export async function deleteConnection(id) {
  try {
    return await db.feishuWikiConnection.delete({ where: { id } });
  } catch (error) {
    console.error('Failed to delete Feishu wiki connection:', error);
    throw error;
  }
}

export async function updateConnectionStatus(id, status) {
  try {
    return await db.feishuWikiConnection.update({
      where: { id },
      data: { status, updateAt: new Date() }
    });
  } catch (error) {
    console.error('Failed to update connection status:', error);
    throw error;
  }
}

export async function updateConnectionSyncTime(id) {
  try {
    return await db.feishuWikiConnection.update({
      where: { id },
      data: { lastSyncedAt: new Date(), updateAt: new Date() }
    });
  } catch (error) {
    console.error('Failed to update sync time:', error);
    throw error;
  }
}

export async function getDocuments(connectionId, options = {}) {
  try {
    const { page = 1, pageSize = 50 } = options;
    const [data, total] = await Promise.all([
      db.feishuWikiDocument.findMany({
        where: { connectionId },
        orderBy: { folderPath: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.feishuWikiDocument.count({ where: { connectionId } })
    ]);
    return { data, total };
  } catch (error) {
    console.error('Failed to get documents:', error);
    throw error;
  }
}

export async function getDocumentByNodeToken(connectionId, nodeToken) {
  try {
    return await db.feishuWikiDocument.findFirst({
      where: { connectionId, nodeToken }
    });
  } catch (error) {
    console.error('Failed to get document by node token:', error);
    throw error;
  }
}

export async function upsertDocument(data) {
  try {
    const existing = await db.feishuWikiDocument.findFirst({
      where: { connectionId: data.connectionId, nodeToken: data.nodeToken }
    });
    if (existing) {
      return await db.feishuWikiDocument.update({
        where: { id: existing.id },
        data: {
          ...data,
          syncStatus: 1,
          lastSyncedAt: new Date(),
          updateAt: new Date()
        }
      });
    }
    return await db.feishuWikiDocument.create({
      data: { ...data, syncStatus: 1, lastSyncedAt: new Date() }
    });
  } catch (error) {
    console.error('Failed to upsert document:', error);
    throw error;
  }
}

export async function createSyncLog(data) {
  try {
    return await db.feishuWikiSyncLog.create({ data });
  } catch (error) {
    console.error('Failed to create sync log:', error);
    throw error;
  }
}

export async function updateSyncLog(id, data) {
  try {
    return await db.feishuWikiSyncLog.update({ where: { id }, data });
  } catch (error) {
    console.error('Failed to update sync log:', error);
    throw error;
  }
}

export async function getSyncLogs(connectionId, options = {}) {
  try {
    const { page = 1, pageSize = 20 } = options;
    const [data, total] = await Promise.all([
      db.feishuWikiSyncLog.findMany({
        where: { connectionId },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.feishuWikiSyncLog.count({ where: { connectionId } })
    ]);
    return { data, total };
  } catch (error) {
    console.error('Failed to get sync logs:', error);
    throw error;
  }
}

export async function getDocumentById(id) {
  try {
    return await db.feishuWikiDocument.findUnique({ where: { id } });
  } catch (error) {
    console.error('Failed to get document by id:', error);
    throw error;
  }
}

export async function getDocumentsByIds(ids) {
  try {
    return await db.feishuWikiDocument.findMany({
      where: { id: { in: ids } }
    });
  } catch (error) {
    console.error('Failed to get documents by ids:', error);
    throw error;
  }
}
