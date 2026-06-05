'use client';
import { Card, CardContent, Typography, Box, Chip, Button, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

export default function RAGTestSetCard({ testSet, projectId, onRunEval, onDelete }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);

  const questionCount = testSet._count?.questions || testSet.questionCount || 0;
  const evalCount = testSet._count?.evalRuns || testSet.evalCount || 0;
  const tags = testSet.tags ? testSet.tags.split(',').filter(Boolean) : [];

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        '&:hover': {
          boxShadow: 2,
          borderColor: 'primary.main'
        }
      }}
      onClick={() => router.push(`/projects/${projectId}/rag-testing/${testSet.id}`)}
    >
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="subtitle1" fontWeight="bold" noWrap sx={{ flex: 1 }}>
            {testSet.name}
          </Typography>
          <IconButton
            size="small"
            onClick={e => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {testSet.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
            {testSet.description}
          </Typography>
        )}

        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {questionCount} {t('ragTesting.questions')}
          </Typography>
          {evalCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {evalCount} {t('ragTesting.evaluations')}
            </Typography>
          )}
        </Box>

        {tags.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {tags.map(tag => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 1, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Tooltip title={t('ragTesting.runEval')}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlayArrowIcon fontSize="small" />}
            onClick={e => { e.stopPropagation(); onRunEval(testSet); }}
          >
            {t('ragTesting.runEval')}
          </Button>
        </Tooltip>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={e => {
            e.stopPropagation();
            onDelete(testSet.id);
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
