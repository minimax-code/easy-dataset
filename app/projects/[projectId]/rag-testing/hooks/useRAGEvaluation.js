'use client';
import { useState, useCallback } from 'react';
import axios from 'axios';

export function useRAGEvaluation(projectId) {
  const [evalRuns, setEvalRuns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchEvalRuns = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/projects/${projectId}/rag-testing/evaluations`, {
        params: { page, pageSize: 20 }
      });
      setEvalRuns(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to fetch eval runs:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createEvalRun = async data => {
    const res = await axios.post(`/api/projects/${projectId}/rag-testing/evaluations`, data);
    return res.data;
  };

  return { evalRuns, total, loading, fetchEvalRuns, createEvalRun };
}
