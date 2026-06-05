'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Tooltip
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

export default function RAGTestSetList({ testSets, projectId, onRunEval, onDelete }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTestSet, setMenuTestSet] = useState(null);

  const handleMenuOpen = (e, testSet) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setMenuTestSet(testSet);
  };

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('ragTesting.testSetName', { defaultValue: 'Name' })}</TableCell>
            <TableCell>{t('ragTesting.questions')}</TableCell>
            <TableCell>{t('ragTesting.evaluations')}</TableCell>
            <TableCell align="right">{t('common.actions', { defaultValue: 'Actions' })}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {testSets.map(testSet => {
            const qCount = testSet._count?.questions || testSet.questionCount || 0;
            const eCount = testSet._count?.evalRuns || testSet.evalCount || 0;
            return (
              <TableRow
                key={testSet.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => router.push(`/projects/${projectId}/rag-testing/${testSet.id}`)}
              >
                <TableCell>
                  <Box>
                    <Box sx={{ fontWeight: 600 }}>{testSet.name}</Box>
                    {testSet.description && (
                      <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.5 }}>{testSet.description}</Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{qCount}</TableCell>
                <TableCell>{eCount}</TableCell>
                <TableCell align="right">
                  <Tooltip title={t('ragTesting.runEval')}>
                    <IconButton size="small" onClick={e => { e.stopPropagation(); onRunEval(testSet); }}>
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton size="small" onClick={e => handleMenuOpen(e, testSet)}>
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
