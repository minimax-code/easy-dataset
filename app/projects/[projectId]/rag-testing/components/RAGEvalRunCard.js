'use client';

import { Card, CardContent, Typography, Box, Chip, LinearProgress, Button, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG = {
  0: { label: 'Processing', color: 'warning' },
  1: { label: 'Completed', color: 'success' },
  2: { label: 'Failed', color: 'error' }
};

function MiniMetricBar({ label, value }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <Box sx={{ flex: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" fontWeight="bold">{(value || 0).toFixed(2)}</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 4,
          borderRadius: 2,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            bgcolor: pct >= 70 ? 'success.main' : pct >= 40 ? 'warning.main' : 'error.main'
          }
        }}
      />
    </Box>
  );
}

export default function RAGEvalRunCard({ run, projectId, onDelete }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);

  const task = run.task;
  const status = STATUS_CONFIG[task?.status] || STATUS_CONFIG[0];
  const metrics = typeof run.aggregateMetrics === 'string'
    ? JSON.parse(run.aggregateMetrics || '{}')
    : run.aggregateMetrics || {};

  const isProcessing = task?.status === 0;
  const progress = task?.totalCount > 0 ? (task.completedCount / task.totalCount) * 100 : 0;

  return (
    <Card
      variant="outlined"
      sx={{
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.main'
        }
      }}
      onClick={() => router.push(`/projects/${projectId}/rag-testing/evaluations/${run.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>
              {run.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(run.createAt || Date.now()).toLocaleString()}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={run.endpoint?.name || 'Unknown'} size="small" variant="outlined" />
          <Chip label={status.label} size="small" color={status.color} variant="outlined" />
        </Box>

        {isProcessing && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('ragTesting.evaluations.inProgress', { defaultValue: 'In progress' })}
              </Typography>
              <Typography variant="caption" fontWeight="bold">
                {task.completedCount}/{task.totalCount}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}

        {!isProcessing && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            {metrics.faithfulness > 0 && (
              <MiniMetricBar label="F" value={metrics.faithfulness} />
            )}
            {metrics.relevancy > 0 && (
              <MiniMetricBar label="R" value={metrics.relevancy} />
            )}
            {metrics.mrr > 0 && (
              <MiniMetricBar label="MRR" value={metrics.mrr} />
            )}
          </Box>
        )}
      </CardContent>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={e => {
            e.stopPropagation();
            router.push(`/projects/${projectId}/rag-testing/evaluations/${run.id}`);
            setAnchorEl(null);
          }}
        >
          {t('ragTesting.viewResults', { defaultValue: 'View Results' })}
        </MenuItem>
        <MenuItem
          onClick={e => {
            e.stopPropagation();
            onDelete(run.id);
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          {t('ragTesting.delete')}
        </MenuItem>
      </Menu>
    </Card>
  );
}
