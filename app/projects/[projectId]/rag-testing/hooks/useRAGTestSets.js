'use client';
import { useState, useCallback } from 'react';
import axios from 'axios';

export function useRAGTestSets(projectId) {
  const [testSets, setTestSets] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const fetchTestSets = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/projects/${projectId}/rag-testing/test-sets`, {
        params: { page: p, pageSize: 20 }
      });
      setTestSets(res.data.data);
      setTotal(res.data.total);
      setPage(p);
    } catch (error) {
      console.error('Failed to fetch test sets:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createTestSet = async data => {
    const res = await axios.post(`/api/projects/${projectId}/rag-testing/test-sets`, data);
    fetchTestSets(page);
    return res.data;
  };

  const deleteTestSets = async ids => {
    await axios.delete(`/api/projects/${projectId}/rag-testing/test-sets`, { data: { ids } });
    fetchTestSets(page);
  };

  return { testSets, total, loading, page, fetchTestSets, createTestSet, deleteTestSets };
}
