'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Pagination,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Alert,
  Divider,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import UploadIcon from '@mui/icons-material/Upload';
import QuizIcon from '@mui/icons-material/Quiz';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import RAGTestSetCard from './components/RAGTestSetCard';
import RAGTestSetList from './components/RAGTestSetList';
import RAGImportDialog from './components/RAGImportDialog';
import RAGEvalConfigDialog from './components/RAGEvalConfigDialog';
import { useRAGTestSets } from './hooks/useRAGTestSets';

export default function RAGTestingPage() {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const router = useRouter();
  const { testSets, total, loading, page, fetchTestSets, createTestSet, deleteTestSets } = useRAGTestSets(projectId);

  const [viewMode, setViewMode] = useState('card');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [evalTargetTestSet, setEvalTargetTestSet] = useState(null);
  const [endpoints, setEndpoints] = useState([]);

  // Chunk selection dialog state
  const [openChunkDialog, setOpenChunkDialog] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [selectedChunks, setSelectedChunks] = useState([]);
  const [modelConfigs, setModelConfigs] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('');
  const [testSetName, setTestSetName] = useState('');
  const [testSetDesc, setTestSetDesc] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchTestSets(1);
    axios.get(`/api/projects/${projectId}/rag-testing/endpoints`).then(res => setEndpoints(res.data)).catch(console.error);
  }, [fetchTestSets, projectId]);

  const fetchChunksAndModels = useCallback(async () => {
    setChunksLoading(true);
    try {
      const chunksRes = await axios.post(`/api/projects/${projectId}/chunks`, { fileIds: [] });
      const allChunks = chunksRes.data.data || [];
      const validChunks = allChunks.filter(c => c.content && c.content.length > 100);
      setChunks(validChunks);

      const modelsRes = await axios.get(`/api/projects/${projectId}/model-config`);
      const models = modelsRes.data.data || [];
      setModelConfigs(models);
      if (models.length > 0) {
        setSelectedModelId(models[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch chunks/models:', error);
      toast.error(t('ragTesting.fetchFailed', { defaultValue: 'Failed to load data' }));
    } finally {
      setChunksLoading(false);
    }
  }, [projectId, t]);

  const handleOpenChunkDialog = () => {
    setOpenChunkDialog(true);
    setSelectedChunks([]);
    setTestSetName('');
    setTestSetDesc('');
    fetchChunksAndModels();
  };

  const handleToggleChunk = chunkId => {
    setSelectedChunks(prev =>
      prev.includes(chunkId) ? prev.filter(id => id !== chunkId) : [...prev, chunkId]
    );
  };

  const handleSelectAll = () => {
    if (selectedChunks.length === chunks.length) {
      setSelectedChunks([]);
    } else {
      setSelectedChunks(chunks.map(c => c.id));
    }
  };

  const handleGenerateFromChunks = async () => {
    if (!testSetName.trim()) {
      toast.error(t('ragTesting.nameRequired', { defaultValue: 'Test set name is required' }));
      return;
    }
    if (selectedChunks.length === 0) {
      toast.error(t('ragTesting.selectChunks', { defaultValue: 'Please select at least one chunk' }));
      return;
    }
    if (!selectedModelId) {
      toast.error(t('ragTesting.selectModel', { defaultValue: 'Please select a model' }));
      return;
    }

    setGenerating(true);
    try {
      const createRes = await axios.post(`/api/projects/${projectId}/rag-testing/test-sets`, {
        name: testSetName,
        description: testSetDesc
      });
      const testSetId = createRes.data.id;

      await axios.post(`/api/projects/${projectId}/rag-testing/test-sets/${testSetId}/questions`, {
        action: 'generate',
        chunkIds: selectedChunks,
        modelConfigId: selectedModelId
      });

      toast.success(t('ragTesting.generationStarted', { defaultValue: 'Question generation started' }));
      setOpenChunkDialog(false);
      fetchTestSets(page);
      router.push(`/projects/${projectId}/rag-testing/${testSetId}`);
    } catch (error) {
      console.error('Failed to generate:', error);
      toast.error(t('ragTesting.generationFailed', { defaultValue: 'Failed to start generation' }));
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = id => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    try {
      await deleteTestSets([deleteDialog.id]);
      setDeleteDialog({ open: false, id: null });
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleRunEval = testSet => {
    setEvalTargetTestSet(testSet);
    setEvalDialogOpen(true);
  };

  const filteredTestSets = testSets.filter(ts =>
    ts.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (ts.description || '').toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const totalPages = Math.ceil(total / 20);

  return (
    <Box>
      {/* Toolbar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder={t('ragTesting.searchTestSets', { defaultValue: 'Search test sets...' })}
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          sx={{ minWidth: 240, flex: 1 }}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={(e, val) => val && setViewMode(val)}
          >
            <ToggleButton value="card">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setImportOpen(true)}>
            {t('ragTesting.import.title', { defaultValue: 'Import' })}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenChunkDialog}>
            {t('ragTesting.generateFromChunks')}
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : testSets.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
          <QuizIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {t('ragTesting.noTestSets', { defaultValue: 'No test sets yet' })}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            {t('ragTesting.noTestSetsHint', { defaultValue: 'Create a test set by generating questions from your document chunks, or import existing questions.' })}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenChunkDialog} size="large">
              {t('ragTesting.generateFromChunks')}
            </Button>
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => setImportOpen(true)} size="large">
              {t('ragTesting.import.title', { defaultValue: 'Import' })}
            </Button>
          </Box>
        </Paper>
      ) : filteredTestSets.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {t('ragTesting.noSearchResults', { defaultValue: 'No test sets match your search.' })}
          </Typography>
        </Paper>
      ) : viewMode === 'card' ? (
        <>
          <Grid container spacing={2}>
            {filteredTestSets.map(testSet => (
              <Grid item xs={12} sm={6} md={4} key={testSet.id}>
                <RAGTestSetCard
                  testSet={testSet}
                  projectId={projectId}
                  onRunEval={handleRunEval}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, p) => fetchTestSets(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      ) : (
        <>
          <RAGTestSetList
            testSets={filteredTestSets}
            projectId={projectId}
            onRunEval={handleRunEval}
            onDelete={handleDelete}
          />
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, p) => fetchTestSets(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Import Dialog */}
      <RAGImportDialog
        open={importOpen}
        onClose={refresh => {
          setImportOpen(false);
          if (refresh) fetchTestSets(page);
        }}
        projectId={projectId}
      />

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>{t('ragTesting.testSetDeleteConfirm', { defaultValue: 'Delete Test Set' })}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('ragTesting.testSetDeleteConfirmMessage', { defaultValue: 'Are you sure you want to delete this test set? This action cannot be undone.' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {t('common.delete', { defaultValue: 'Delete' })}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Eval Config Dialog */}
      <RAGEvalConfigDialog
        open={evalDialogOpen}
        onClose={() => setEvalDialogOpen(false)}
        projectId={projectId}
        testSets={evalTargetTestSet ? [evalTargetTestSet] : []}
        endpoints={endpoints}
      />

      {/* Generate from Chunks Dialog */}
      <Dialog open={openChunkDialog} onClose={() => setOpenChunkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('ragTesting.generateFromChunks')}</DialogTitle>
        <DialogContent>
          <TextField
            label={t('ragTesting.testSetName', { defaultValue: 'Test Set Name' })}
            value={testSetName}
            onChange={e => setTestSetName(e.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 1 }}
            required
          />
          <TextField
            label={t('ragTesting.description', { defaultValue: 'Description' })}
            value={testSetDesc}
            onChange={e => setTestSetDesc(e.target.value)}
            fullWidth
            size="small"
            sx={{ mt: 2 }}
            multiline
            rows={2}
          />

          <FormControl fullWidth size="small" sx={{ mt: 2 }}>
            <InputLabel>{t('ragTesting.selectLLMModel', { defaultValue: 'LLM Model for Generation' })}</InputLabel>
            <Select
              value={selectedModelId}
              label={t('ragTesting.selectLLMModel', { defaultValue: 'LLM Model for Generation' })}
              onChange={e => setSelectedModelId(e.target.value)}
            >
              {modelConfigs.map(model => (
                <MenuItem key={model.id} value={model.id}>
                  {model.name || model.modelName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('ragTesting.selectChunksLabel', { defaultValue: 'Select Chunks to Generate Questions From' })}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Button size="small" onClick={handleSelectAll}>
              {selectedChunks.length === chunks.length
                ? t('ragTesting.deselectAll', { defaultValue: 'Deselect All' })
                : t('ragTesting.selectAll', { defaultValue: 'Select All' })}
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
              {selectedChunks.length} / {chunks.length} {t('ragTesting.selected', { defaultValue: 'selected' })}
            </Typography>
          </Box>

          {chunksLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : chunks.length === 0 ? (
            <Alert severity="warning">
              {t('ragTesting.noChunks', { defaultValue: 'No chunks available. Please split some documents first.' })}
            </Alert>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              {chunks.map(chunk => (
                <ListItem key={chunk.id} dense disablePadding>
                  <ListItemButton onClick={() => handleToggleChunk(chunk.id)}>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedChunks.includes(chunk.id)}
                        tabIndex={-1}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={chunk.name}
                      secondary={`${chunk.size || 0} chars`}
                      primaryTypographyProps={{ noWrap: true }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenChunkDialog(false)}>{t('ragTesting.cancel', { defaultValue: 'Cancel' })}</Button>
          <Button
            variant="contained"
            onClick={handleGenerateFromChunks}
            disabled={generating || selectedChunks.length === 0 || !testSetName.trim() || !selectedModelId}
          >
            {generating ? <CircularProgress size={20} color="inherit" /> : t('ragTesting.generate', { defaultValue: 'Generate' })}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
