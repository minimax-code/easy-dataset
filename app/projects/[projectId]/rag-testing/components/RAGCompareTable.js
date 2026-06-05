'use client';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';

function deltaColor(delta) {
  if (delta > 0.01) return 'success.main';
  if (delta < -0.01) return 'error.main';
  return 'text.secondary';
}

function deltaSign(delta) {
  if (delta > 0.01) return `+${delta.toFixed(2)}`;
  if (delta < -0.01) return delta.toFixed(2);
  return '0.00';
}

export default function RAGCompareTable({ comparison }) {
  const { t } = useTranslation();
  if (!comparison) return null;

  const { runA, runB, comparison: metrics, questionDeltas } = comparison;

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        {t('ragTesting.compare.metricsComparison')}
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Metric</TableCell>
              <TableCell align="right">{runA.name}</TableCell>
              <TableCell align="right">{runB.name}</TableCell>
              <TableCell align="right">{t('ragTesting.compare.delta')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metrics.map(row => (
              <TableRow key={row.metric}>
                <TableCell>{row.metric}</TableCell>
                <TableCell align="right">{row.runA.toFixed(2)}</TableCell>
                <TableCell align="right">{row.runB.toFixed(2)}</TableCell>
                <TableCell align="right" sx={{ color: deltaColor(row.delta), fontWeight: 'bold' }}>
                  {deltaSign(row.delta)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Biggest improvements and regressions */}
      {questionDeltas && questionDeltas.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>{t('ragTesting.compare.improvements')}</Typography>
          {[...questionDeltas]
            .sort((a, b) => b.faithfulness.delta - a.faithfulness.delta)
            .slice(0, 3)
            .filter(q => q.faithfulness.delta > 0.01)
            .map(q => (
              <Box key={q.questionId} sx={{ mb: 0.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ flex: 1, noWrap: true }}>{q.question.slice(0, 60)}...</Typography>
                <Chip label={`F: ${deltaSign(q.faithfulness.delta)}`} size="small" color="success" variant="outlined" />
              </Box>
            ))}

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>{t('ragTesting.compare.regressions')}</Typography>
          {[...questionDeltas]
            .sort((a, b) => a.faithfulness.delta - b.faithfulness.delta)
            .slice(0, 3)
            .filter(q => q.faithfulness.delta < -0.01)
            .map(q => (
              <Box key={q.questionId} sx={{ mb: 0.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                <Typography variant="body2" sx={{ flex: 1 }}>{q.question.slice(0, 60)}...</Typography>
                <Chip label={`F: ${deltaSign(q.faithfulness.delta)}`} size="small" color="error" variant="outlined" />
              </Box>
            ))}
        </Box>
      )}
    </Box>
  );
}
