'use client';

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

/**
 * Feishu Wiki documents hook for a specific connection
 * @param {string} connectionId
 */
export default function useFeishuWikiDocuments(connectionId) {
  const { projectId } = useParams();
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const fetchDocuments = useCallback(async () => {
    if (!projectId || !connectionId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/projects/${projectId}/feishu-wiki/connections/${connectionId}/documents`,
        { params: { page, pageSize } }
      );
      setDocuments(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setDocuments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [projectId, connectionId, page, pageSize]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    total,
    loading,
    page,
    pageSize,
    setPage,
    fetchDocuments
  };
}
