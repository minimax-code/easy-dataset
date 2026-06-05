'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

export default function TestSetDetailPage() {
  const { t } = useTranslation();
  const { projectId, testSetId } = useParams();
  const router = useRouter();

  const [testSet, setTestSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, approved: 0, draft: 0 });
  const [loading, setLoading] = useState(true);
  const [editQuestion, setEditQuestion] = useState(null);
  const [editText, setEditText] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  const fetchTestSet = useCallback(async () => {
    try {
      const res = await axios.get(`/api/projects/${projectId}/rag-testing/test-sets/${testSetId}`);
      setTestSet(res.data);
    } catch (error) {
      console.error('Failed to fetch test set:', error);
    }
  }, [projectId, testSetId]);

  const fetchQuestions = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const [qRes, sRes] = await Promise.all([
        axios.get(`/api/projects/${projectId}/rag-testing/test-sets/${testSetId}/questions`, {
          params: { page: p, pageSize: 50 }
        }),
        axios.get(`/api/projects/${projectId}/rag-testing/test-sets/${testSetId}/questions`, {
          params: { stats: true }
        })
      ]);
      setQuestions(qRes.data.data);
      setTotal(qRes.data.total);
      setStats(sRes.data);
      setPage(p);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, testSetId]);

  useEffect(() => {
    fetchTestSet();
    fetchQuestions(1);
  }, [fetchTestSet, fetchQuestions]);

  const handleApprove = async id => {
    await axios.put(`/api/projects/${projectId}/rag-testing/test-sets/${testSetId}/questions`, { id, status: 1 });
    fetchQuestions(page);
  };

  const handleReject = async id => {
    await axios.put(`/api/projects/${projectId}/rag-testing/test-sets/${testSetId}/questions`, { id, status: 0 });
    fetchQuestions(page);
  };

  const handleApproveAll = async () => {
    await axios.put(`/api/projects/${projectId}/rag-testing/test-sets/${testSetId}/questions`, { action: 'approveAll' });
    fetchQuestions(page);
  };

  const handleDelete = async id => {
    await axios.delete(`/api/projects/${projectId}/rag-testing/test-sets/${testSetId}/questions`, {
      data: { ids: [id] }
    });
    fetchQuestions(page);
  };

  const handleEditSave = async () => {
    await axios.put(`/api/projects/${projectId}/rag-testing/test-sets/${testSetId}/questions`, {
      id: editQuestion.id,
      question: editText,
      referenceAnswer: editAnswer
    });
    setEditQuestion(null);
    fetchQuestions(page);
  };

  const totalPages = Math.ceil(total / 50);

  if (!testSet) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton onClick={() => router.push(`/projects/${projectId}/rag-testing`)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flex: 1 }}>
          {testSet.name}
        </Typography>
      </Box>

      {/* Stats bar */}
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 3 }}>
        <Typography variant="body2">
          {stats.total} {t('ragTesting.questions')}
        </Typography>
        <Typography variant="body2" color="success.main">
          {stats.approved} {t('ragTesting.approved')}
        </Typography>
        <Typography variant="body2" color="warning.main">
          {stats.draft} {t('ragTesting.draft')}
        </Typography>
      </Paper>

      {/* Toolbar */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button variant="outlined" size="small" onClick={handleApproveAll}>
          {t('ragTesting.approveAll')}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('ragTesting.question')}</TableCell>
                  <TableCell>{t('ragTesting.referenceAnswer')}</TableCell>
                  <TableCell>{t('ragTesting.status')}</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.map(q => (
                  <TableRow key={q.id}>
                    <TableCell sx={{ maxWidth: 300 }}>
                      {editQuestion?.id === q.id ? (
                        <TextField
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          size="small"
                          fullWidth
                          multiline
                        />
                      ) : (
                        <Typography variant="body2">{q.question}</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>
                      {editQuestion?.id === q.id ? (
                        <TextField
                          value={editAnswer}
                          onChange={e => setEditAnswer(e.target.value)}
                          size="small"
                          fullWidth
                          multiline
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {q.referenceAnswer}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={q.status === 1 ? t('ragTesting.approved') : t('ragTesting.draft')}
                        size="small"
                        color={q.status === 1 ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {editQuestion?.id === q.id ? (
                        <>
                          <Button size="small" onClick={handleEditSave}>Save</Button>
                          <Button size="small" onClick={() => setEditQuestion(null)}>Cancel</Button>
                        </>
                      ) : (
                        <>
                          <Tooltip title={t('ragTesting.approve')}>
                            <IconButton size="small" onClick={() => handleApprove(q.id)}>
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('ragTesting.reject')}>
                            <IconButton size="small" onClick={() => handleReject(q.id)}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('ragTesting.edit')}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditQuestion(q);
                                setEditText(q.question);
                                setEditAnswer(q.referenceAnswer);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('ragTesting.delete')}>
                            <IconButton size="small" onClick={() => handleDelete(q.id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={totalPages} page={page} onChange={(e, p) => fetchQuestions(p)} color="primary" />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
