'use client';
import { Box, Card, CardContent, Typography, Grid, Chip } from '@mui/material';

function MetricCard({ label, value }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <Card variant="outlined" sx={{ textAlign: 'center' }}>
      <CardContent>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            color: pct >= 70 ? 'success.main' : pct >= 40 ? 'warning.main' : 'error.main'
          }}
        >
          {(value || 0).toFixed(2)}
        </Typography>
        <Box sx={{
          mt: 1, height: 6, borderRadius: 3, bgcolor: 'grey.200',
          '& > div': {
            height: '100%', borderRadius: 3,
            bgcolor: pct >= 70 ? 'success.main' : pct >= 40 ? 'warning.main' : 'error.main',
            width: `${pct}%`
          }
        }}>
          <div />
        </Box>
      </CardContent>
    </Card>
  );
}

export default function RAGMetricsDashboard({ metrics, stats }) {
  if (!metrics) return null;

  return (
    <Box>
      {stats && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={`Total: ${stats.total}`} size="small" variant="outlined" />
          <Chip label={`Passed: ${stats.passed}`} size="small" color="success" variant="outlined" />
          <Chip label={`Failed: ${stats.failed}`} size="small" color="warning" variant="outlined" />
          {stats.errors > 0 && (
            <Chip label={`Errors: ${stats.errors}`} size="small" color="error" variant="outlined" />
          )}
        </Box>
      )}

      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        Aggregate Metrics
      </Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <MetricCard label="Faithfulness" value={metrics.faithfulness} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <MetricCard label="Relevancy" value={metrics.relevancy} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <MetricCard label="Ctx Precision" value={metrics.contextPrecision} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <MetricCard label="Ctx Recall" value={metrics.contextRecall} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <MetricCard label="Recall@5" value={metrics.recallAt5} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <MetricCard label="MRR" value={metrics.mrr} />
        </Grid>
        <Grid item xs={6} sm={4} md={3} lg={2}>
          <MetricCard label="NDCG@10" value={metrics.ndcgAt10} />
        </Grid>
        {metrics.toolSelectionAccuracy > 0 && (
          <Grid item xs={6} sm={4} md={3} lg={2}>
            <MetricCard label="Tool Accuracy" value={metrics.toolSelectionAccuracy} />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
