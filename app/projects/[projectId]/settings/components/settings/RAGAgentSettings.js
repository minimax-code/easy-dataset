'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'sonner';

const ENDPOINT_TYPES = [
  { value: 'openai-compatible', labelKey: 'ragTesting.typeOpenai' },
  { value: 'innopaas', labelKey: 'ragTesting.typeInnopaas' },
  { value: 'langchain', labelKey: 'ragTesting.typeLangchain' },
  { value: 'custom', labelKey: 'ragTesting.typeCustom' }
];

const defaultForm = {
  name: '',
  baseUrl: '',
  endpointType: 'innopaas',
  authConfig: { apiKey: '', botId: '' },
  requestMapping: {},
  responseMapping: {},
  tokenMapping: {}
};

export default function RAGAgentSettings({ projectId }) {
  const { t } = useTranslation();
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchEndpoints = useCallback(async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/rag-testing/endpoints`);
      setEndpoints(res.data);
    } catch (error) {
      console.error('Failed to fetch endpoints:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  const handleOpenDialog = (endpoint = null) => {
    if (endpoint) {
      setEditingId(endpoint.id);
      const authConfig = typeof endpoint.authConfig === 'string' ? JSON.parse(endpoint.authConfig) : endpoint.authConfig;
      const requestMapping =
        typeof endpoint.requestMapping === 'string' ? JSON.parse(endpoint.requestMapping) : endpoint.requestMapping;
      const responseMapping =
        typeof endpoint.responseMapping === 'string' ? JSON.parse(endpoint.responseMapping) : endpoint.responseMapping;
      const tokenMapping =
        typeof endpoint.tokenMapping === 'string' ? JSON.parse(endpoint.tokenMapping) : endpoint.tokenMapping;
      setForm({
        name: endpoint.name,
        baseUrl: endpoint.baseUrl,
        endpointType: endpoint.endpointType,
        authConfig,
        requestMapping,
        responseMapping,
        tokenMapping
      });
    } else {
      setEditingId(null);
      setForm({ ...defaultForm });
    }
    setTestResult(null);
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.baseUrl) {
      toast.error('Name and Base URL are required');
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/projects/${projectId}/rag-testing/endpoints`, {
          id: editingId,
          ...form
        });
        toast.success('Endpoint updated');
      } else {
        await axios.post(`/api/projects/${projectId}/rag-testing/endpoints`, form);
        toast.success('Endpoint created');
      }
      setOpenDialog(false);
      fetchEndpoints();
    } catch (error) {
      toast.error('Failed to save endpoint');
    }
  };

  const handleDelete = async id => {
    if (!confirm(t('ragTesting.settings.deleteConfirm'))) return;
    try {
      await axios.delete(`/api/projects/${projectId}/rag-testing/endpoints`, { data: { ids: [id] } });
      toast.success('Endpoint deleted');
      fetchEndpoints();
    } catch (error) {
      toast.error('Failed to delete endpoint');
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      let currentEndpointId = editingId;

      // First save the endpoint if new so we can update its status later
      if (!currentEndpointId) {
        const res = await axios.post(`/api/projects/${projectId}/rag-testing/endpoints`, form);
        currentEndpointId = res.data.id;
        setEditingId(currentEndpointId);
      } else {
        await axios.put(`/api/projects/${projectId}/rag-testing/endpoints`, { id: currentEndpointId, ...form });
      }

      const testRes = await fetch(`/api/projects/${projectId}/rag-testing/endpoints/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointId: currentEndpointId })
      });

      const data = await testRes.json();

      if (!testRes.ok) {
        setTestResult({ success: false, message: data.error || 'Test connection failed' });
      } else {
        setTestResult(data);
        // Refresh endpoint list to show updated status
        fetchEndpoints();
      }
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = status => {
    if (status === 1) return <CheckCircleIcon color="success" fontSize="small" />;
    if (status === 2) return <ErrorIcon color="error" fontSize="small" />;
    return <HelpOutlineIcon color="disabled" fontSize="small" />;
  };

  const getStatusText = status => {
    if (status === 1) return t('ragTesting.connected');
    if (status === 2) return t('ragTesting.connectionFailed');
    return t('ragTesting.notTested');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6">{t('ragTesting.settings.tabTitle')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('ragTesting.settings.description')}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          {t('ragTesting.addEndpoint')}
        </Button>
      </Box>

      {endpoints.length === 0 && (
        <Alert severity="info">{t('ragTesting.settings.noEndpoints')}</Alert>
      )}

      <Stack spacing={2}>
        {endpoints.map(endpoint => (
          <Card key={endpoint.id} variant="outlined">
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {endpoint.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {endpoint.baseUrl}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                  <Chip
                    label={t(`ragTesting.type${endpoint.endpointType === 'openai-compatible' ? 'Openai' : endpoint.endpointType.charAt(0).toUpperCase() + endpoint.endpointType.slice(1)}`)}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    icon={getStatusIcon(endpoint.status)}
                    label={getStatusText(endpoint.status)}
                    size="small"
                    color={endpoint.status === 1 ? 'success' : endpoint.status === 2 ? 'error' : 'default'}
                    variant="outlined"
                  />
                </Box>
              </Box>
              <Box>
                <Tooltip title={t('ragTesting.edit')}>
                  <IconButton onClick={() => handleOpenDialog(endpoint)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('ragTesting.delete')}>
                  <IconButton onClick={() => handleDelete(endpoint.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? t('ragTesting.editEndpoint') : t('ragTesting.configureEndpoint')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('ragTesting.endpointName')}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              fullWidth
              size="small"
            />
            <FormControl fullWidth size="small">
              <InputLabel>{t('ragTesting.endpointType')}</InputLabel>
              <Select
                value={form.endpointType}
                label={t('ragTesting.endpointType')}
                onChange={e => setForm(f => ({ ...f, endpointType: e.target.value }))}
              >
                {ENDPOINT_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {t(type.labelKey)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t('ragTesting.baseUrl')}
              value={form.baseUrl}
              onChange={e => setForm(f => ({ ...f, baseUrl: e.target.value }))}
              fullWidth
              size="small"
              placeholder="https://ragagent.example.com:8445"
            />

            {/* InnoPaas-specific fields */}
            {form.endpointType === 'innopaas' && (
              <>
                <TextField
                  label={t('ragTesting.botId')}
                  value={form.authConfig.botId || ''}
                  onChange={e => setForm(f => ({ ...f, authConfig: { ...f.authConfig, botId: e.target.value } }))}
                  fullWidth
                  size="small"
                />
                <TextField
                  label={t('ragTesting.apiKey')}
                  type={showApiKey ? 'text' : 'password'}
                  value={form.authConfig.apiKey || ''}
                  onChange={e => setForm(f => ({ ...f, authConfig: { ...f.authConfig, apiKey: e.target.value } }))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowApiKey(!showApiKey)} edge="end" size="small">
                          {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <Alert severity="info" variant="outlined">
                  Auth: API Key → JWT Token → Bearer Auth
                  <br />
                  Chat: /api/v1/bot/{'{bot_id}'}/chat
                </Alert>
              </>
            )}

            {/* OpenAI Compatible fields */}
            {form.endpointType === 'openai-compatible' && (
              <>
                <TextField
                  label={t('ragTesting.apiKey')}
                  type={showApiKey ? 'text' : 'password'}
                  value={form.authConfig.apiKey || ''}
                  onChange={e => setForm(f => ({ ...f, authConfig: { ...f.authConfig, apiKey: e.target.value } }))}
                  fullWidth
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowApiKey(!showApiKey)} edge="end" size="small">
                          {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                <TextField
                  label={t('ragTesting.modelName')}
                  value={form.authConfig.modelName || ''}
                  onChange={e => setForm(f => ({ ...f, authConfig: { ...f.authConfig, modelName: e.target.value } }))}
                  fullWidth
                  size="small"
                  placeholder="gpt-3.5-turbo"
                />
              </>
            )}

            {/* Custom Schema fields */}
            {form.endpointType === 'custom' && (
              <>
                <TextField
                  label={t('ragTesting.customHeaders')}
                  value={typeof form.authConfig.customHeaders === 'object' ? JSON.stringify(form.authConfig.customHeaders, null, 2) : form.authConfig.customHeaders || '{}'}
                  onChange={e => {
                    try {
                      setForm(f => ({ ...f, authConfig: { ...f.authConfig, customHeaders: JSON.parse(e.target.value) } }));
                    } catch { /* allow editing */ }
                  }}
                  fullWidth
                  size="small"
                  multiline
                  rows={3}
                />
              </>
            )}

            {testResult && (
              <Alert severity={testResult.success ? 'success' : 'error'} variant="outlined">
                {testResult.message}
                {testResult.latency_ms && ` (${testResult.latency_ms}ms)`}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleTestConnection} disabled={testing} startIcon={testing ? <CircularProgress size={16} /> : null}>
            {t('ragTesting.testConnection')}
          </Button>
          <Button onClick={() => setOpenDialog(false)}>{t('ragTesting.cancel')}</Button>
          <Button variant="contained" onClick={handleSave}>{t('ragTesting.save')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
