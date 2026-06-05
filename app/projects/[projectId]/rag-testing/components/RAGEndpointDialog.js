'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const ENDPOINT_TYPES = [
  { value: 'openai-compatible', label: 'OpenAI Compatible' },
  { value: 'innopaas', label: 'InnoPaas' },
  { value: 'langchain', label: 'LangChain' },
  { value: 'custom', label: 'Custom' }
];

function TabPanel({ children, value, index }) {
  if (value !== index) return null;
  return <Box sx={{ pt: 2 }}>{children}</Box>;
}

export default function RAGEndpointDialog({ open, onClose, projectId, endpoint = null }) {
  const { t } = useTranslation();
  const isEdit = Boolean(endpoint);

  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [endpointType, setEndpointType] = useState('openai-compatible');
  const [apiKey, setApiKey] = useState('');
  const [botId, setBotId] = useState('');
  const [requestMapping, setRequestMapping] = useState('{}');
  const [responseMapping, setResponseMapping] = useState('{}');
  const [tokenMapping, setTokenMapping] = useState('{}');
  const [activeTab, setActiveTab] = useState(0);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (endpoint) {
        setName(endpoint.name || '');
        setBaseUrl(endpoint.baseUrl || '');
        setEndpointType(endpoint.endpointType || 'openai-compatible');
        const auth = typeof endpoint.authConfig === 'string' ? JSON.parse(endpoint.authConfig || '{}') : endpoint.authConfig || {};
        setApiKey(auth.apiKey || '');
        setBotId(auth.botId || '');
        const reqMap = typeof endpoint.requestMapping === 'string' ? JSON.parse(endpoint.requestMapping || '{}') : endpoint.requestMapping || {};
        const resMap = typeof endpoint.responseMapping === 'string' ? JSON.parse(endpoint.responseMapping || '{}') : endpoint.responseMapping || {};
        const tokMap = typeof endpoint.tokenMapping === 'string' ? JSON.parse(endpoint.tokenMapping || '{}') : endpoint.tokenMapping || {};
        setRequestMapping(JSON.stringify(reqMap, null, 2));
        setResponseMapping(JSON.stringify(resMap, null, 2));
        setTokenMapping(JSON.stringify(tokMap, null, 2));
      } else {
        setName('');
        setBaseUrl('');
        setEndpointType('openai-compatible');
        setApiKey('');
        setBotId('');
        setRequestMapping('{}');
        setResponseMapping('{}');
        setTokenMapping('{}');
      }
      setTestResult(null);
      setError('');
      setActiveTab(0);
    }
  }, [open, endpoint]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await axios.post(`/api/projects/${projectId}/rag-testing/endpoints/test-connection`, {
        endpointId: endpoint?.id || undefined,
        endpointType,
        baseUrl,
        authConfig: { apiKey, botId },
        requestMapping: JSON.parse(requestMapping || '{}'),
        responseMapping: JSON.parse(responseMapping || '{}'),
        tokenMapping: JSON.parse(tokenMapping || '{}')
      });
      setTestResult(res.data);
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.message || err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !baseUrl.trim()) {
      setError(t('ragTesting.agents.nameUrlRequired', { defaultValue: 'Name and Base URL are required' }));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        name: name.trim(),
        baseUrl: baseUrl.trim(),
        endpointType,
        authConfig: { apiKey, botId },
        requestMapping: JSON.parse(requestMapping || '{}'),
        responseMapping: JSON.parse(responseMapping || '{}'),
        tokenMapping: JSON.parse(tokenMapping || '{}')
      };
      if (isEdit) {
        await axios.put(`/api/projects/${projectId}/rag-testing/endpoints`, { id: endpoint.id, ...payload });
      } else {
        await axios.post(`/api/projects/${projectId}/rag-testing/endpoints`, payload);
      }
      onClose(true);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const showAdvanced = endpointType === 'custom';

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? t('ragTesting.agents.editAgent', { defaultValue: 'Edit Agent' }) : t('ragTesting.agents.addAgent', { defaultValue: 'Add Agent' })}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label={t('ragTesting.agents.name', { defaultValue: 'Name' })}
            value={name}
            onChange={e => setName(e.target.value)}
            fullWidth
            size="small"
            required
          />
          <TextField
            label={t('ragTesting.agents.baseUrl', { defaultValue: 'Base URL' })}
            value={baseUrl}
            onChange={e => setBaseUrl(e.target.value)}
            fullWidth
            size="small"
            required
            placeholder="https://api.example.com/v1"
          />

          <FormControl fullWidth size="small">
            <InputLabel>{t('ragTesting.agents.endpointType', { defaultValue: 'Endpoint Type' })}</InputLabel>
            <Select
              value={endpointType}
              label={t('ragTesting.agents.endpointType', { defaultValue: 'Endpoint Type' })}
              onChange={e => setEndpointType(e.target.value)}
            >
              {ENDPOINT_TYPES.map(t => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={t('ragTesting.agents.tabAuth', { defaultValue: 'Auth' })} />
            {showAdvanced && <Tab label={t('ragTesting.agents.tabMapping', { defaultValue: 'Mapping' })} />}
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label={t('ragTesting.agents.apiKey', { defaultValue: 'API Key' })}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                fullWidth
                size="small"
                type="password"
              />
              {endpointType === 'innopaas' && (
                <TextField
                  label={t('ragTesting.agents.botId', { defaultValue: 'Bot ID' })}
                  value={botId}
                  onChange={e => setBotId(e.target.value)}
                  fullWidth
                  size="small"
                />
              )}
            </Box>
          </TabPanel>

          {showAdvanced && (
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label={t('ragTesting.agents.requestMapping', { defaultValue: 'Request Mapping (JSON)' })}
                  value={requestMapping}
                  onChange={e => setRequestMapping(e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  rows={4}
                  helperText={t('ragTesting.agents.mappingHelper', { defaultValue: 'Map request body fields' })}
                />
                <TextField
                  label={t('ragTesting.agents.responseMapping', { defaultValue: 'Response Mapping (JSON)' })}
                  value={responseMapping}
                  onChange={e => setResponseMapping(e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  rows={4}
                  helperText={t('ragTesting.agents.mappingHelper', { defaultValue: 'Map response fields' })}
                />
                <TextField
                  label={t('ragTesting.agents.tokenMapping', { defaultValue: 'Token Mapping (JSON)' })}
                  value={tokenMapping}
                  onChange={e => setTokenMapping(e.target.value)}
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                />
              </Box>
            </TabPanel>
          )}

          {testResult && (
            <Alert severity={testResult.success ? 'success' : 'error'}>
              {testResult.success
                ? t('ragTesting.agents.connectionSuccess', { defaultValue: 'Connection successful' })
                : t('ragTesting.agents.connectionFailed', { defaultValue: 'Connection failed' })}
              : {testResult.message}
              {testResult.latency_ms && ` (${testResult.latency_ms}ms)`}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>{t('common.cancel', { defaultValue: 'Cancel' })}</Button>
        <Button
          variant="outlined"
          onClick={handleTestConnection}
          disabled={testing || !baseUrl.trim()}
          startIcon={testing ? <CircularProgress size={16} /> : null}
        >
          {t('ragTesting.agents.testConnection', { defaultValue: 'Test Connection' })}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !name.trim() || !baseUrl.trim()}
          startIcon={submitting ? <CircularProgress size={16} /> : null}
        >
          {isEdit ? t('common.save', { defaultValue: 'Save' }) : t('common.create', { defaultValue: 'Create' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
