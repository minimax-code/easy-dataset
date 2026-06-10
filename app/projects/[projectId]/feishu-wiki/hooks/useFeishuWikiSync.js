'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Feishu Wiki sync hook - triggers sync and polls task status
 * @param {string} connectionId
 */
export default function useFeishuWikiSync(connectionId) {
  const { projectId } = useParams();
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncLogsTotal, setSyncLogsTotal] = useState(0);
  const intervalRef = useRef(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pollTaskStatus = useCallback(
    async id => {
      try {
        const res = await axios.get(`/api/projects/${projectId}/tasks/${id}`);
        const task = res.data.data;
        // Task status: 0 = PROCESSING, 1 = COMPLETED, 2 = FAILED, 3 = INTERRUPTED
        if (task.status !== 0) {
          stopPolling();
          setSyncing(false);
          if (task.status === 1) {
            toast.success(t('feishuWiki.syncDocuments', { defaultValue: 'Sync completed' }));
          } else if (task.status === 2) {
            toast.error(t('feishuWiki.connectionFailed', { defaultValue: 'Sync failed' }) + ': ' + (task.note || ''));
          }
        }
      } catch (error) {
        console.error('Failed to poll task status:', error);
        stopPolling();
        setSyncing(false);
      }
    },
    [projectId, stopPolling, t]
  );

  const startPolling = useCallback(
    id => {
      stopPolling();
      intervalRef.current = setInterval(() => pollTaskStatus(id), 3000);
    },
    [stopPolling, pollTaskStatus]
  );

  const triggerSync = useCallback(async () => {
    if (!projectId || !connectionId) return;
    setSyncing(true);
    try {
      const res = await axios.post(`/api/projects/${projectId}/feishu-wiki/connections/${connectionId}/sync`);
      const newTaskId = res.data?.taskId || res.data?.data?.taskId || res.data?.data?.id;
      if (newTaskId) {
        setTaskId(newTaskId);
        startPolling(newTaskId);
      } else {
        setSyncing(false);
      }
      return res.data;
    } catch (error) {
      toast.error(t('feishuWiki.connectionFailed', { defaultValue: 'Sync failed' }) + ': ' + (error.response?.data?.error || error.message));
      setSyncing(false);
      throw error;
    }
  }, [projectId, connectionId, startPolling, t]);

  const fetchSyncLogs = useCallback(
    async (page = 1) => {
      if (!projectId || !connectionId) return;
      try {
        const res = await axios.get(`/api/projects/${projectId}/feishu-wiki/connections/${connectionId}/sync-logs`, {
          params: { page, pageSize: 20 }
        });
        setSyncLogs(res.data.data || []);
        setSyncLogsTotal(res.data.total || 0);
      } catch (error) {
        console.error('Failed to fetch sync logs:', error);
        setSyncLogs([]);
        setSyncLogsTotal(0);
      }
    },
    [projectId, connectionId]
  );

  return {
    syncing,
    taskId,
    triggerSync,
    syncLogs,
    syncLogsTotal,
    fetchSyncLogs
  };
}
