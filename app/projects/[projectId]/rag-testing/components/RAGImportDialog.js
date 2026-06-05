'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Tabs,
  Tab,
  Box,
  Alert,
  Typography,
  CircularProgress
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'sonner';

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

export default function RAGImportDialog({ open, onClose, projectId }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [csvText, setCsvText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const parseQuestions = () => {
    const questions = [];
    if (activeTab === 0) {
      // JSON
      const data = JSON.parse(jsonText);
      if (!Array.isArray(data)) throw new Error('JSON must be an array');
      for (const item of data) {
        if (!item.question) throw new Error('Each item must have a question');
        questions.push({
          question: item.question,
          referenceAnswer: item.referenceAnswer || item.reference_answer || '',
          relevantChunkIds: item.relevantChunkIds || item.relevant_chunks || []
        });
      }
    } else {
      // CSV
      const lines = csvText.trim().split('\n');
      if (lines.length < 2) throw new Error('CSV must have a header and at least one data row');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const qIdx = headers.findIndex(h => h === 'question');
      const aIdx = headers.findIndex(h => h === 'reference_answer' || h === 'referenceAnswer');
      const cIdx = headers.findIndex(h => h === 'relevant_chunks' || h === 'relevantChunkIds');
      if (qIdx === -1) throw new Error('CSV must have a "question" column');
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        questions.push({
          question: cells[qIdx],
          referenceAnswer: aIdx >= 0 ? cells[aIdx] : '',
          relevantChunkIds: cIdx >= 0 ? cells[cIdx].split(';').filter(Boolean) : []
        });
      }
    }
    return questions;
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError(t('ragTesting.nameRequired', { defaultValue: 'Test set name is required' }));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const questions = parseQuestions();
      if (questions.length === 0) {
        setError(t('ragTesting.import.noQuestions', { defaultValue: 'No questions found in import data' }));
        setSubmitting(false);
        return;
      }
      await axios.post(`/api/projects/${projectId}/rag-testing/test-sets`, {
        name: name.trim(),
        description: description.trim(),
        questions
      });
      toast.success(t('ragTesting.import.success', { defaultValue: 'Imported {{count}} questions', count: questions.length }));
      onClose(true);
    } catch (err) {
      setError(err.message || t('ragTesting.import.failed', { defaultValue: 'Import failed' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle>{t('ragTesting.import.title', { defaultValue: 'Import Test Set' })}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label={t('ragTesting.testSetName', { defaultValue: 'Test Set Name' })}
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            size="small"
            required
          />
          <TextField
            label={t('ragTesting.description', { defaultValue: 'Description' })}
            value={description}
            onChange={e => setDescription(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
          />

          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="JSON" />
            <Tab label="CSV" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <TextField
              label={t('ragTesting.import.jsonLabel', { defaultValue: 'JSON Array' })}
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              fullWidth
              multiline
              rows={8}
              placeholder={`[\n  {\n    "question": "What is RAG?",\n    "referenceAnswer": "Retrieval-Augmented Generation",\n    "relevantChunkIds": ["chunk-1"]\n  }\n]`}
              helperText={t('ragTesting.import.jsonHelper', { defaultValue: 'Array of objects with question, referenceAnswer, relevantChunkIds' })}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <TextField
              label={t('ragTesting.import.csvLabel', { defaultValue: 'CSV Data' })}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              fullWidth
              multiline
              rows={8}
              placeholder={`question,reference_answer,relevant_chunks\nWhat is RAG?,Retrieval-Augmented Generation,chunk-1;chunk-2`}
              helperText={t('ragTesting.import.csvHelper', { defaultValue: 'First row is header. Columns: question, reference_answer, relevant_chunks (optional, semicolon-separated)' })}
            />
          </TabPanel>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !name.trim() || (activeTab === 0 ? !jsonText.trim() : !csvText.trim())}
          startIcon={submitting ? <CircularProgress size={16} /> : null}
        >
          {t('ragTesting.import.upload', { defaultValue: 'Import' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
