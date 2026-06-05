'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

export default function RAGEvalConfigDialog({ open, onClose, projectId, testSets = [], endpoints = [] }) {
  const { t } = useTranslation();
  const [selectedTestSet, setSelectedTestSet] = useState('');
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [selectedJudge, setSelectedJudge] = useState('');
  const [evalOptions, setEvalOptions] = useState({
    faithfulness: true,
    relevancy: true,
    contextQuality: true,
    traceEval: false
  });
  const [modelConfigs, setModelConfigs] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      axios.get(`/api/projects/${projectId}/model-config`).then(res => {
        setModelConfigs(res.data?.data || res.data || []);
      }).catch(console.error);
    }
  }, [open, projectId]);

  const handleSubmit = async () => {
    if (!selectedTestSet || !selectedEndpoint) return;
    setSubmitting(true);
    try {
      await axios.post(`/api/projects/${projectId}/rag-testing/evaluations`, {
        testSetId: selectedTestSet,
        endpointId: selectedEndpoint,
        judgeModelId: selectedJudge || null,
        evalOptions,
        name: `Eval ${new Date().toLocaleString()}`
      });
      onClose(true);
    } catch (error) {
      console.error('Failed to start eval:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const hasTestSets = testSets.length > 0;
  const hasEndpoints = endpoints.length > 0;

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{t('ragTesting.evalConfig')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {!hasTestSets && (
            <Alert severity="warning">
              {t('ragTesting.noTestSetsForEval', { defaultValue: 'No test sets available. Please create a test set first.' })}
            </Alert>
          )}
          {!hasEndpoints && (
            <Alert severity="warning">
              {t('ragTesting.noEndpointsForEval', { defaultValue: 'No RAG agents configured. Please add an agent first.' })}
            </Alert>
          )}

          <FormControl fullWidth size="small" disabled={!hasTestSets}>
            <InputLabel>{t('ragTesting.selectTestSet')}</InputLabel>
            <Select value={selectedTestSet} label={t('ragTesting.selectTestSet')} onChange={e => setSelectedTestSet(e.target.value)}>
              {testSets.map(ts => (
                <MenuItem key={ts.id} value={ts.id}>{ts.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" disabled={!hasEndpoints}>
            <InputLabel>{t('ragTesting.selectAgent')}</InputLabel>
            <Select value={selectedEndpoint} label={t('ragTesting.selectAgent')} onChange={e => setSelectedEndpoint(e.target.value)}>
              {endpoints.map(ep => (
                <MenuItem key={ep.id} value={ep.id}>{ep.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>{t('ragTesting.selectJudgeModel')}</InputLabel>
            <Select value={selectedJudge} label={t('ragTesting.selectJudgeModel')} onChange={e => setSelectedJudge(e.target.value)}>
              <MenuItem value="">None</MenuItem>
              {modelConfigs.map(mc => (
                <MenuItem key={mc.id} value={mc.id}>{mc.modelName || mc.modelId}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2">{t('ragTesting.evalOptions')}</Typography>
          <FormControlLabel
            control={<Checkbox checked={evalOptions.faithfulness} onChange={e => setEvalOptions(o => ({ ...o, faithfulness: e.target.checked }))} />}
            label={t('ragTesting.faithfulnessOption')}
          />
          <FormControlLabel
            control={<Checkbox checked={evalOptions.relevancy} onChange={e => setEvalOptions(o => ({ ...o, relevancy: e.target.checked }))} />}
            label={t('ragTesting.relevancyOption')}
          />
          <FormControlLabel
            control={<Checkbox checked={evalOptions.contextQuality} onChange={e => setEvalOptions(o => ({ ...o, contextQuality: e.target.checked }))} />}
            label={t('ragTesting.contextQualityOption')}
          />
          <FormControlLabel
            control={<Checkbox checked={evalOptions.traceEval} onChange={e => setEvalOptions(o => ({ ...o, traceEval: e.target.checked }))} />}
            label={t('ragTesting.traceEvalOption')}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>{t('ragTesting.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedTestSet || !selectedEndpoint || submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : null}
        >
          {t('ragTesting.startEval')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
