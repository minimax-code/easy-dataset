'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography,
  Box,
  Button,
  IconButton,
  CircularProgress,
  Pagination,
  Menu,
  MenuItem,
  Divider,
  Paper,
  Grid,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  TextField
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExportIcon from '@mui/icons-material/IosShare';
import RefreshIcon from '@mui/icons-material/Refresh';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'sonner';
import RAGMetricsDashboard from '../../components/RAGMetricsDashboard';
import RAGResultCard from '../../components/RAGResultCard';
import { useRAGResults } from '../../hooks/useRAGResults';

export default function EvaluationDetailPage() {
  const { t } = useTranslation();
  const { projectId, evaluationId } = useParams();
  const router = useRouter();
  const [evalRun, setEvalRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportAnchor, setExportAnchor] = useState(null);
  const { results, total, loading: resultsLoading, fetchResults } = useRAGResults(projectId, evaluationId);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');

  const fetchEvalRun = useCallback(async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/rag-testing/evaluations/${evaluationId}`);
      setEvalRun(res.data);
    } catch (error) {
      console.error('Failed to fetch eval run:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, evaluationId]);

  useEffect(() => {
    fetchEvalRun();
  }, [fetchEvalRun]);

  useEffect(() => {
    if (evaluationId) fetchResults(1);
  }, [evaluationId, fetchResults]);

  // Auto-refresh while processing
  useEffect(() => {
    if (evalRun?.task?.status !== 0) return;
    const interval = setInterval(() => {
      fetchEvalRun();
      fetchResults(page);
    }, 5000);
    return () => clearInterval(interval);
  }, [evalRun, fetchEvalRun, fetchResults, page]);

  const metrics = evalRun
    ? typeof evalRun.aggregateMetrics === 'string'
      ? JSON.parse(evalRun.aggregateMetrics || '{}')
      : evalRun.aggregateMetrics || {}
    : {};

  const passThreshold = 0.7;

  const stats = useMemo(() => {
    if (!results.length) return { total: 0, passed: 0, failed: 0, errors: 0 };
    const total = results.length;
    const errors = results.filter(r => r.status === 2).length;
    const passed = results.filter(r => {
      if (r.status === 2) return false;
      return (r.faithfulness || 0) >= passThreshold && (r.relevancy || 0) >= passThreshold;
    }).length;
    return { total, passed, failed: total - passed - errors, errors };
  }, [results]);

  const filteredResults = useMemo(() => {
    let filtered = results;
    if (filterStatus === 'passed') {
      filtered = filtered.filter(r => {
        if (r.status === 2) return false;
        return (r.faithfulness || 0) >= passThreshold && (r.relevancy || 0) >= passThreshold;
      });
    } else if (filterStatus === 'failed') {
      filtered = filtered.filter(r => {
        if (r.status === 2) return false;
        return (r.faithfulness || 0) < passThreshold || (r.relevancy || 0) < passThreshold;
      });
    } else if (filterStatus === 'error') {
      filtered = filtered.filter(r => r.status === 2);
    }
    if (searchText.trim()) {
      const kw = searchText.toLowerCase();
      filtered = filtered.filter(r =>
        (r.testQuestion?.question || '').toLowerCase().includes(kw) ||
        (r.agentAnswer || '').toLowerCase().includes(kw)
      );
    }
    return filtered;
  }, [results, filterStatus, searchText]);

  const handleExport = async format => {
    try {
      const res = await axios.get(
        `/api/projects/${projectId}/rag-testing/evaluations/${evaluationId}/export`,
        { params: { format } }
      );
      let data, mimeType, filename;
      if (format === 'json') {
        data = JSON.stringify(res.data, null, 2);
        mimeType = 'application/json';
        filename = `eval-${evaluationId}.json`;
      } else if (format === 'csv') {
        // If API returns CSV string
        data = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        mimeType = 'text/csv';
        filename = `eval-${evaluationId}.csv`;
      } else if (format === 'md') {
        data = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        mimeType = 'text/markdown';
        filename = `eval-${evaluationId}.md`;
      } else {
        data = JSON.stringify(res.data, null, 2);
        mimeType = 'application/json';
        filename = `eval-${evaluationId}.json`;
      }
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(t('ragTesting.exportFailed', { defaultValue: 'Export failed' }));
    }
    setExportAnchor(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!evalRun) {
    return (
      <Box sx={{ mt: 3 }}>
        <Typography>Evaluation not found</Typography>
      </Box>
    );
  }

  const taskStatus = evalRun.task?.status;
  const totalPages = Math.ceil(total / 50);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => router.push(`/projects/${projectId}/rag-testing/evaluations`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flex: 1 }}>
          {evalRun.name}
        </Typography>
        <Button
          size="small"
          startIcon={<RefreshIcon />}
          onClick={() => { fetchEvalRun(); fetchResults(page); }}
          disabled={loading || resultsLoading}
          sx={{ mr: 1 }}
        >
          {t('common.refresh', { defaultValue: 'Refresh' })}
        </Button>
        <Button
          size="small"
          startIcon={<ExportIcon />}
          onClick={e => setExportAnchor(e.currentTarget)}
        >
          {t('ragTesting.export')}
        </Button>
      </Box>

      {/* Task Progress */}
      {taskStatus === 0 && evalRun.task && (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              {t('ragTesting.evaluations.inProgress', { defaultValue: 'Evaluation in progress' })}...
            </Typography>
            <Typography variant="body2" color="primary">
              {evalRun.task.completedCount}/{evalRun.task.totalCount}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={evalRun.task.totalCount > 0 ? (evalRun.task.completedCount / evalRun.task.totalCount) * 100 : 0}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Paper>
      )}

      {/* Run Info */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2">
            {t('ragTesting.agent', { defaultValue: 'Agent' })}: {evalRun.endpoint?.name || 'Unknown'}
          </Typography>
          <Typography variant="body2">
            {t('ragTesting.testSet', { defaultValue: 'Test Set' })}: {evalRun.testSet?.name || 'Unknown'}
          </Typography>
          <Typography variant="body2">
            {t('ragTesting.status', { defaultValue: 'Status' })}: {taskStatus === 1 ? t('ragTesting.completed', { defaultValue: 'Completed' }) : taskStatus === 0 ? t('ragProcessing', { defaultValue: 'Processing' }) : t('ragTesting.failed', { defaultValue: 'Failed' })}
          </Typography>
          {stats.total > 0 && (
            <>
              <Chip label={`${t('ragTesting.results.passed', { defaultValue: 'Passed' })}: ${stats.passed}`} size="small" color="success" variant="outlined" />
              <Chip label={`${t('ragTesting.results.failed', { defaultValue: 'Failed' })}: ${stats.failed}`} size="small" color="warning" variant="outlined" />
              {stats.errors > 0 && (
                <Chip label={`${t('ragTesting.results.errors', { defaultValue: 'Errors' })}: ${stats.errors}`} size="small" color="error" variant="outlined" />
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Metrics Dashboard */}
      {Object.keys(metrics).length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <RAGMetricsDashboard metrics={metrics} stats={stats} />
        </Paper>
      )}

      {/* Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder={t('ragTesting.searchQuestions', { defaultValue: 'Search questions...' })}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          sx={{ minWidth: 240, flex: 1 }}
        />
        <ToggleButtonGroup
          size="small"
          value={filterStatus}
          exclusive
          onChange={(e, val) => val !== null && setFilterStatus(val)}
        >
          <ToggleButton value="all">
            {t('ragTesting.filterAll', { defaultValue: 'All' })}
          </ToggleButton>
          <ToggleButton value="passed">
            {t('ragTesting.results.passed', { defaultValue: 'Passed' })}
          </ToggleButton>
          <ToggleButton value="failed">
            {t('ragTesting.results.failed', { defaultValue: 'Failed' })}
          </ToggleButton>
          <ToggleButton value="error">
            {t('ragTesting.results.failed', { defaultValue: 'Errors' })}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Per-question results */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        {t('ragTesting.results.perQuestion', { defaultValue: 'Per-Question Results' })}
      </Typography>

      {resultsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredResults.length === 0 ? (
        <Typography color="text.secondary">
          {t('ragTesting.results.noResults', { defaultValue: 'No results match the current filter.' })}
        </Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {filteredResults.map((r, i) => (
              <Grid item xs={12} md={6} key={r.id}>
                <RAGResultCard result={r} index={(page - 1) * 50 + i} />
              </Grid>
            ))}
          </Grid>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, p) => { setPage(p); fetchResults(p); }}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Export menu */}
      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={() => setExportAnchor(null)}
      >
        <MenuItem onClick={() => handleExport('json')}>JSON</MenuItem>
        <MenuItem onClick={() => handleExport('csv')}>CSV</MenuItem>
        <Divider />
        <MenuItem onClick={() => handleExport('md')}>Markdown</MenuItem>
      </Menu>
    </Box>
  );
}
