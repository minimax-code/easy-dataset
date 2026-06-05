'use client';

import { Card, CardContent, Typography, Box, Chip, IconButton, Button, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const TYPE_LABELS = {
  'openai-compatible': 'OpenAI',
  innopaas: 'InnoPaas',
  langchain: 'LangChain',
  custom: 'Custom'
};

const STATUS_CONFIG = {
  0: { label: 'Not Tested', color: 'default' },
  1: { label: 'Connected', color: 'success' },
  2: { label: 'Failed', color: 'error' }
};

export default function RAGEndpointCard({ endpoint, onEdit, onDelete, onTest }) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);

  const status = STATUS_CONFIG[endpoint.status] || STATUS_CONFIG[0];

  return (
    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>
              {endpoint.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
              {endpoint.baseUrl}
            </Typography>
          </Box>
          <IconButton size="small" onClick={e => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={TYPE_LABELS[endpoint.endpointType] || endpoint.endpointType} size="small" variant="outlined" />
          <Chip label={status.label} size="small" color={status.color} variant="outlined" />
        </Box>

        {endpoint.lastTestedAt && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {t('ragTesting.agents.lastTested', { defaultValue: 'Last tested' })}: {new Date(endpoint.lastTestedAt).toLocaleString()}
          </Typography>
        )}
      </CardContent>

      <Box sx={{ p: 1, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button size="small" variant="outlined" onClick={e => { e.stopPropagation(); onTest(endpoint); }}>
          {t('ragTesting.agents.testConnection', { defaultValue: 'Test' })}
        </Button>
        <Button size="small" variant="contained" onClick={e => { e.stopPropagation(); onEdit(endpoint); }}>
          {t('common.edit', { defaultValue: 'Edit' })}
        </Button>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={e => { e.stopPropagation(); onEdit(endpoint); setAnchorEl(null); }}
        >
          {t('common.edit', { defaultValue: 'Edit' })}
        </MenuItem>
        <MenuItem
          onClick={e => { e.stopPropagation(); onDelete(endpoint.id); setAnchorEl(null); }}
          sx={{ color: 'error.main' }}
        >
          {t('common.delete', { defaultValue: 'Delete' })}
        </MenuItem>
      </Menu>
    </Card>
  );
}
