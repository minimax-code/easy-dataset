'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

export default function FeishuWikiConnectionDialog({ open, onClose, onSave, editData, testConnection, fetchSpaces }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [form, setForm] = useState({
    name: '',
    appId: '',
    appSecret: '',
    spaceId: '',
    spaceName: ''
  });
  const [showSecret, setShowSecret] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [spaces, setSpaces] = useState([]);
  const [fetchingSpaces, setFetchingSpaces] = useState(false);
  const [fetchSpacesError, setFetchSpacesError] = useState(null);

  const isEditing = !!editData;

  useEffect(() => {
    if (open) {
      if (editData) {
        setForm({
          name: editData.name || '',
          appId: editData.appId || '',
          appSecret: editData.appSecret || '',
          spaceId: editData.spaceId || '',
          spaceName: editData.spaceName || ''
        });
      } else {
        setForm({ name: '', appId: '', appSecret: '', spaceId: '', spaceName: '' });
      }
      setTestResult(null);
      setSpaces([]);
      setShowSecret(false);
      setFetchSpacesError(null);
    }
  }, [open, editData]);

  const handleChange = field => e => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleFetchSpaces = async () => {
    if (!form.appId || !form.appSecret) return;
    setFetchingSpaces(true);
    setFetchSpacesError(null);
    try {
      const result = await fetchSpaces(form.appId, form.appSecret);
      setSpaces(result || []);
    } catch (error) {
      setFetchSpacesError(error.message || 'Failed to fetch spaces');
      setSpaces([]);
    } finally {
      setFetchingSpaces(false);
    }
  };

  const handleTestConnection = async () => {
    if (!form.appId || !form.appSecret || !form.spaceId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection(form.appId, form.appSecret, form.spaceId);
      setTestResult({ success: true, message: t('feishuWiki.testConnectionSuccess', { defaultValue: 'Connection successful' }) });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || t('feishuWiki.testConnectionFailed', { defaultValue: 'Connection failed' })
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSpaceSelect = e => {
    const selectedSpaceId = e.target.value;
    const selectedSpace = spaces.find(s => s.spaceId === selectedSpaceId);
    setForm(prev => ({
      ...prev,
      spaceId: selectedSpaceId,
      spaceName: selectedSpace?.spaceName || ''
    }));
  };

  const handleSave = () => {
    onSave({
      ...form,
      ...(editData?.id && { id: editData.id })
    });
  };

  const isSaveDisabled = !form.name || !form.appId || !form.appSecret || !form.spaceId;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEditing
          ? t('feishuWiki.editConnection', { defaultValue: 'Edit Connection' })
          : t('feishuWiki.addConnection', { defaultValue: 'Add Connection' })}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={t('feishuWiki.connectionName', { defaultValue: 'Connection Name' })}
            value={form.name}
            onChange={handleChange('name')}
            fullWidth
            required
            size="small"
          />
          <TextField
            label={t('feishuWiki.appId', { defaultValue: 'App ID' })}
            value={form.appId}
            onChange={handleChange('appId')}
            fullWidth
            required
            size="small"
          />
          <TextField
            label={t('feishuWiki.appSecret', { defaultValue: 'App Secret' })}
            type={showSecret ? 'text' : 'password'}
            value={form.appSecret}
            onChange={handleChange('appSecret')}
            fullWidth
            required
            size="small"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowSecret(!showSecret)} edge="end" size="small">
                    {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Fetch Spaces + Test Connection buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleFetchSpaces}
              disabled={fetchingSpaces || !form.appId || !form.appSecret}
              startIcon={fetchingSpaces ? <CircularProgress size={16} /> : null}
              sx={{ flex: 1 }}
            >
              {t('feishuWiki.fetchSpaces', { defaultValue: 'Fetch Spaces' })}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleTestConnection}
              disabled={testing || !form.appId || !form.appSecret || !form.spaceId}
              startIcon={testing ? <CircularProgress size={16} /> : null}
              sx={{ flex: 1 }}
            >
              {t('feishuWiki.testConnection', { defaultValue: 'Test Connection' })}
            </Button>
          </Box>

          {/* Space selector or manual entry */}
          {spaces.length > 0 ? (
            <FormControl fullWidth size="small">
              <InputLabel>{t('feishuWiki.spaceName', { defaultValue: 'Space' })}</InputLabel>
              <Select
                value={form.spaceId}
                label={t('feishuWiki.spaceName', { defaultValue: 'Space' })}
                onChange={handleSpaceSelect}
              >
                {spaces.map(space => (
                  <MenuItem key={space.spaceId} value={space.spaceId}>
                    {space.spaceName} ({space.spaceId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              label={t('feishuWiki.spaceId', { defaultValue: 'Space ID' })}
              value={form.spaceId}
              onChange={handleChange('spaceId')}
              fullWidth
              size="small"
              helperText={
                fetchSpacesError
                  ? fetchSpacesError
                  : t('feishuWiki.fetchSpaces', { defaultValue: 'Fetch Spaces' }) +
                    ' ' +
                    t('feishuWiki.cancel', { defaultValue: 'or enter manually' })
              }
            />
          )}

          <TextField
            label={t('feishuWiki.spaceName', { defaultValue: 'Space Name' })}
            value={form.spaceName}
            onChange={handleChange('spaceName')}
            fullWidth
            size="small"
            disabled={spaces.length > 0 && !!form.spaceId}
          />

          {/* Test result display */}
          {testResult && (
            <Alert
              severity={testResult.success ? 'success' : 'error'}
              variant="outlined"
              icon={testResult.success ? <CheckCircleIcon /> : <ErrorIcon />}
            >
              {testResult.message}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('feishuWiki.cancel', { defaultValue: 'Cancel' })}</Button>
        <Button variant="contained" onClick={handleSave} disabled={isSaveDisabled}>
          {t('feishuWiki.save', { defaultValue: 'Save' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
