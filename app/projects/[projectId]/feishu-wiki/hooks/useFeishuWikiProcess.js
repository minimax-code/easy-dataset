'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function useFeishuWikiProcess(connectionId) {
  const { projectId } = useParams();
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const intervalRef = useRef(null);

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
        if (task.status !== 0) {
          stopPolling();
          setProcessing(false);
          if (task.status === 1) {
            toast.success(t('feishuWiki.processComplete', { defaultValue: 'Document processing completed' }));
          } else if (task.status === 2) {
            toast.error(t('feishuWiki.processFailed', { defaultValue: 'Document processing failed' }) + ': ' + (task.note || ''));
          }
        }
      } catch (error) {
        console.error('Failed to poll task status:', error);
        stopPolling();
        setProcessing(false);
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

  const processDocuments = useCallback(
    async (documentIds, domainTreeAction = 'keep') => {
      if (!projectId || !connectionId || !documentIds.length) return;
      setProcessing(true);
      try {
        const res = await axios.post(
          `/api/projects/${projectId}/feishu-wiki/connections/${connectionId}/process`,
          { documentIds, domainTreeAction }
        );
        const newTaskId = res.data?.taskId;
        if (newTaskId) {
          setTaskId(newTaskId);
          startPolling(newTaskId);
        } else {
          setProcessing(false);
        }
        return res.data;
      } catch (error) {
        toast.error(
          t('feishuWiki.processFailed', { defaultValue: 'Document processing failed' }) +
            ': ' +
            (error.response?.data?.error || error.message)
        );
        setProcessing(false);
        throw error;
      }
    },
    [projectId, connectionId, startPolling, t]
  );

  return {
    processing,
    taskId,
    processDocuments
  };
}
