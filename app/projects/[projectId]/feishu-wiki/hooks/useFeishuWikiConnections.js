'use client';

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Feishu Wiki connections CRUD hook
 */
export default function useFeishuWikiConnections() {
  const { projectId } = useParams();
  const { t } = useTranslation();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/projects/${projectId}/feishu-wiki/connections`);
      setConnections(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      toast.error(t('feishuWiki.connectionFailed', { defaultValue: 'Failed to load connections' }));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

  const createConnection = useCallback(
    async data => {
      try {
        await axios.post(`/api/projects/${projectId}/feishu-wiki/connections`, data);
        toast.success(t('feishuWiki.testConnectionSuccess', { defaultValue: 'Created successfully' }));
        await fetchConnections();
      } catch (error) {
        toast.error(error.response?.data?.error || error.message);
        throw error;
      }
    },
    [projectId, fetchConnections, t]
  );

  const updateConnection = useCallback(
    async (id, data) => {
      try {
        await axios.put(`/api/projects/${projectId}/feishu-wiki/connections`, { id, ...data });
        toast.success(t('feishuWiki.testConnectionSuccess', { defaultValue: 'Updated successfully' }));
        await fetchConnections();
      } catch (error) {
        toast.error(error.response?.data?.error || error.message);
        throw error;
      }
    },
    [projectId, fetchConnections, t]
  );

  const deleteConnection = useCallback(
    async ids => {
      try {
        await axios.delete(`/api/projects/${projectId}/feishu-wiki/connections`, { data: { ids } });
        toast.success(t('feishuWiki.delete', { defaultValue: 'Deleted successfully' }));
        await fetchConnections();
      } catch (error) {
        toast.error(error.response?.data?.error || error.message);
        throw error;
      }
    },
    [projectId, fetchConnections, t]
  );

  const testConnection = useCallback(
    async (appId, appSecret, spaceId) => {
      try {
        const res = await axios.post(`/api/projects/${projectId}/feishu-wiki/connections/test`, {
          appId,
          appSecret,
          spaceId
        });
        return res.data;
      } catch (error) {
        toast.error(error.response?.data?.error || error.message);
        throw error;
      }
    },
    [projectId, t]
  );

  const fetchSpaces = useCallback(
    async (appId, appSecret) => {
      try {
        const res = await axios.post(`/api/projects/${projectId}/feishu-wiki/connections/fetch-spaces`, {
          appId,
          appSecret
        });
        return res.data.spaces || [];
      } catch (error) {
        toast.error(error.response?.data?.error || error.message);
        throw error;
      }
    },
    [projectId, t]
  );

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return {
    connections,
    loading,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    fetchSpaces
  };
}
