'use client';
import { useState } from 'react';
import { Card, CardContent, Typography, Box, Chip, Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export default function RAGQuestionResult({ result }) {
  const [expanded, setExpanded] = useState(false);
  const q = result.testQuestion || result.question;
  const retrieved = JSON.parse(result.retrievedChunkIds || '[]');

  return (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ pb: expanded ? 2 : '8px !important' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">{q?.question || result.questionId}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              {result.faithfulness > 0 && <Chip label={`F: ${result.faithfulness.toFixed(2)}`} size="small" color={result.faithfulness >= 0.7 ? 'success' : 'warning'} variant="outlined" />}
              {result.relevancy > 0 && <Chip label={`R: ${result.relevancy.toFixed(2)}`} size="small" color={result.relevancy >= 0.7 ? 'success' : 'warning'} variant="outlined" />}
              {result.contextPrecision > 0 && <Chip label={`CtxP: ${result.contextPrecision.toFixed(2)}`} size="small" variant="outlined" />}
              {result.contextRecall > 0 && <Chip label={`CtxR: ${result.contextRecall.toFixed(2)}`} size="small" variant="outlined" />}
              {result.mrr > 0 && <Chip label={`MRR: ${result.mrr.toFixed(2)}`} size="small" variant="outlined" />}
              {result.status === 2 && <Chip label="Failed" size="small" color="error" />}
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {result.agentAnswer && (
              <Box>
                <Typography variant="caption" color="text.secondary">Agent Answer</Typography>
                <Typography variant="body2">{result.agentAnswer}</Typography>
              </Box>
            )}
            {q?.referenceAnswer && (
              <Box>
                <Typography variant="caption" color="text.secondary">Ground Truth</Typography>
                <Typography variant="body2" color="text.secondary">{q.referenceAnswer}</Typography>
              </Box>
            )}
            {retrieved.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">Retrieved Chunks</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                  {retrieved.map(id => <Chip key={id} label={id.slice(0, 8)} size="small" variant="outlined" />)}
                </Box>
              </Box>
            )}
            {result.faithfulnessExplanation && (
              <Box>
                <Typography variant="caption" color="text.secondary">Faithfulness Explanation</Typography>
                <Typography variant="body2">{result.faithfulnessExplanation}</Typography>
              </Box>
            )}
            {result.relevancyExplanation && (
              <Box>
                <Typography variant="caption" color="text.secondary">Relevancy Explanation</Typography>
                <Typography variant="body2">{result.relevancyExplanation}</Typography>
              </Box>
            )}
            {result.errorMessage && (
              <Typography variant="body2" color="error.main">{result.errorMessage}</Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Duration: {result.duration}ms
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
