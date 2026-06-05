'use client';
import { useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, Collapse, IconButton, Divider, Paper } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTranslation } from 'react-i18next';

function ScoreChip({ label, value }) {
  if (value === undefined || value === null || value === 0) return null;
  const color = value >= 0.7 ? 'success' : value >= 0.4 ? 'warning' : 'error';
  return (
    <Chip label={`${label}: ${value.toFixed(2)}`} size="small" color={color} variant="outlined" />
  );
}

export default function RAGResultCard({ result, index }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const q = result.testQuestion;
  const retrieved = typeof result.retrievedChunkIds === 'string'
    ? JSON.parse(result.retrievedChunkIds || '[]')
    : result.retrievedChunkIds || [];

  const isFailed = result.status === 2;
  const isPassed = !isFailed && result.faithfulness >= 0.7 && result.relevancy >= 0.7;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent sx={{ pb: expanded ? 2 : '8px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', minWidth: 32 }}>
                #{index + 1}
              </Typography>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                {q?.question || result.questionId}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', ml: 5 }}>
              {isFailed && <Chip label={t('ragTesting.results.failed', { defaultValue: 'Failed' })} size="small" color="error" variant="outlined" />}
              {!isFailed && isPassed && <Chip label={t('ragTesting.results.passed', { defaultValue: 'Passed' })} size="small" color="success" variant="outlined" />}
              {!isFailed && !isPassed && <Chip label={t('ragTesting.results.partial', { defaultValue: 'Partial' })} size="small" color="warning" variant="outlined" />}
              <ScoreChip label="F" value={result.faithfulness} />
              <ScoreChip label="R" value={result.relevancy} />
              <ScoreChip label="CtxP" value={result.contextPrecision} />
              <ScoreChip label="CtxR" value={result.contextRecall} />
              <ScoreChip label="MRR" value={result.mrr} />
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Agent Answer vs Ground Truth */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
              <Paper variant="outlined" sx={{ flex: 1, p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  {t('ragTesting.agentAnswer', { defaultValue: 'Agent Answer' })}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {result.agentAnswer || t('ragTesting.noAnswer', { defaultValue: 'No answer' })}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ flex: 1, p: 2, bgcolor: 'success.50' }}>
                <Typography variant="caption" color="success.dark" fontWeight="bold">
                  {t('ragTesting.groundTruth', { defaultValue: 'Ground Truth' })}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                  {q?.referenceAnswer || t('ragTesting.noAnswer', { defaultValue: 'No answer' })}
                </Typography>
              </Paper>
            </Box>

            {/* Retrieved Chunks */}
            {retrieved.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  {t('ragTesting.retrievedChunks', { defaultValue: 'Retrieved Chunks' })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {retrieved.map(id => (
                    <Chip key={id} label={id.slice(0, 8)} size="small" variant="outlined" />
                  ))}
                </Box>
              </Box>
            )}

            {/* Explanations */}
            {result.faithfulnessExplanation && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  {t('ragTesting.faithfulnessExplanation', { defaultValue: 'Faithfulness Explanation' })}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {result.faithfulnessExplanation}
                </Typography>
              </Box>
            )}
            {result.relevancyExplanation && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  {t('ragTesting.relevancyExplanation', { defaultValue: 'Relevancy Explanation' })}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {result.relevancyExplanation}
                </Typography>
              </Box>
            )}

            {/* Error */}
            {result.errorMessage && (
              <Box>
                <Typography variant="body2" color="error.main">
                  {result.errorMessage}
                </Typography>
              </Box>
            )}

            <Typography variant="caption" color="text.secondary">
              {t('ragTesting.duration', { defaultValue: 'Duration' })}: {result.duration}ms
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
