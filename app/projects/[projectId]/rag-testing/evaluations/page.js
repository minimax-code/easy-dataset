'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Button,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import RAGEvalConfigDialog from '../components/RAGEvalConfigDialog';
import RAGEvalRunCard from '../components/RAGEvalRunCard';
import { useRAGEvaluation } from '../hooks/useRAGEvaluation';

export default function EvaluationsPage() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { evalRuns, total, loading, fetchEvalRuns, createEvalRun } = useRAGEvaluation(projectId);
  const [endpoints, setEndpoints] = useState([]);
  const [testSets, setTestSets] = useState([]);
  const [openConfig, setOpenConfig] = useState(false);
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const loadData = useCallback(async () => {
    await fetchEvalRuns(page);
    try {
      const [epRes, tsRes] = await Promise.all([
        axios.get(`/api/projects/${projectId}/rag-testing/endpoints`),
        axios.get(`/api/projects/${projectId}/rag-testing/test-sets`)
      ]);
      setEndpoints(epRes.data);
      setTestSets(tsRes.data.data || tsRes.data);
    } catch (err) {
      console.error('Failed to load endpoints/test sets:', err);
    }
  }, [fetchEvalRuns, projectId, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-refresh while any evaluation is processing
  useEffect(() => {
    const hasProcessing = evalRuns.some(r => r.task?.status === 0);
    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchEvalRuns(page);
    }, 5000);

    return () => clearInterval(interval);
  }, [evalRuns, fetchEvalRuns, page]);

  const handleDelete = id => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/projects/${projectId}/rag-testing/evaluations/${deleteDialog.id}`);
      toast.success(t('ragTesting.evalDeleteSuccess', { defaultValue: 'Evaluation deleted' }));
      fetchEvalRuns(page);
    } catch (error) {
      console.error('Failed to delete evaluation:', error);
      toast.error(t('ragTesting.evalDeleteFailed', { defaultValue: 'Failed to delete evaluation' }));
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box />
        <Button variant="contained" onClick={() => setOpenConfig(true)}>
          {t('ragTesting.runEval')}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : evalRuns.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
          <AssessmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {t('ragTesting.noEvaluations', { defaultValue: 'No evaluations yet' })}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            {t('ragTesting.noEvaluationsHint', { defaultValue: 'Run an evaluation to test your RAG agent against a test set.' })}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenConfig(true)} size="large">
            {t('ragTesting.runEval')}
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2}>
            {evalRuns.map(run => (
              <Grid item xs={12} sm={6} md={4} key={run.id}>
                <RAGEvalRunCard
                  run={run}
                  projectId={projectId}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={totalPages} page={page} onChange={(e, p) => { setPage(p); fetchEvalRuns(p); }} color="primary" />
            </Box>
          )}
        </>
      )}

      <RAGEvalConfigDialog
        open={openConfig}
        onClose={refresh => {
          setOpenConfig(false);
          if (refresh) fetchEvalRuns(page);
        }}
        projectId={projectId}
        testSets={testSets}
        endpoints={endpoints}
      />

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>{t('ragTesting.evalDeleteConfirmTitle', { defaultValue: 'Delete Evaluation' })}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('ragTesting.evalDeleteConfirmMessage', { defaultValue: 'Are you sure you want to delete this evaluation? This action cannot be undone.' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {t('common.delete', { defaultValue: 'Delete' })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
