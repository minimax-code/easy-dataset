'use client';
import { useState, useCallback } from 'react';
import axios from 'axios';

export function useRAGResults(projectId, evaluationId) {
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/projects/${projectId}/rag-testing/evaluations/${evaluationId}/results`,
        { params: { page, pageSize: 50 } }
      );
      setResults(res.data.data);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, evaluationId]);

  return { results, total, loading, fetchResults };
}
