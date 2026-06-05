'use client';
import { Box, Card, CardContent, Typography, Chip, Stack, Paper, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';

function StepCard({ step, index, totalSteps }) {
  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Chip label={`Step ${index + 1}`} size="small" color="primary" variant="outlined" />
          <Typography variant="subtitle2" fontWeight="bold">{step.tool}</Typography>
          {step.duration_ms && (
            <Typography variant="caption" color="text.secondary">
              {step.duration_ms}ms
            </Typography>
          )}
        </Box>
        {step.params && (
          <Box sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Params:</Typography>
            <Paper variant="outlined" sx={{ p: 0.5, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
              {typeof step.params === 'string' ? step.params : JSON.stringify(step.params, null, 2)}
            </Paper>
          </Box>
        )}
        {step.result && (
          <Box>
            <Typography variant="caption" color="text.secondary">Result:</Typography>
            <Paper variant="outlined" sx={{ p: 0.5, bgcolor: 'grey.50', fontFamily: 'monospace', fontSize: '0.75rem', maxHeight: 100, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
              {typeof step.result === 'string' ? step.result : JSON.stringify(step.result, null, 2)}
            </Paper>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function RAGTraceViewer({ trace }) {
  const { t } = useTranslation();
  if (!trace) return null;

  const steps = typeof trace.steps === 'string' ? JSON.parse(trace.steps || '[]') : trace.steps || [];
  const metrics = typeof trace.metrics === 'string' ? JSON.parse(trace.metrics || '{}') : trace.metrics || {};

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        {t('ragTesting.trace.title')}
      </Typography>

      {/* Trace Metrics */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('ragTesting.trace.traceMetrics')}</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2">{t('ragTesting.metrics.totalSteps')}: {trace.totalSteps || steps.length}</Typography>
          <Typography variant="body2">{t('ragTesting.metrics.totalDuration')}: {trace.totalDuration || 0}ms</Typography>
          {metrics.toolSelectionAccuracy > 0 && (
            <Typography variant="body2">{t('ragTesting.metrics.toolSelectionAccuracy')}: {metrics.toolSelectionAccuracy.toFixed(2)}</Typography>
          )}
          {metrics.reasoningCoherence > 0 && (
            <Typography variant="body2">{t('ragTesting.metrics.reasoningCoherence')}: {metrics.reasoningCoherence.toFixed(2)}</Typography>
          )}
          {metrics.redundantSteps > 0 && (
            <Typography variant="body2" color="warning.main">{t('ragTesting.metrics.redundantSteps')}: {metrics.redundantSteps}</Typography>
          )}
        </Box>
      </Paper>

      {/* Execution Timeline */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('ragTesting.trace.executionTimeline')}</Typography>
      <Stack>
        {steps.map((step, i) => (
          <StepCard key={i} step={step} index={i} totalSteps={steps.length} />
        ))}
      </Stack>
      {steps.length === 0 && (
        <Typography color="text.secondary">No trace steps available</Typography>
      )}
    </Box>
  );
}
