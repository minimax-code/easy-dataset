'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Box,
  Button,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StorageIcon from '@mui/icons-material/Storage';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import RAGEndpointCard from '../components/RAGEndpointCard';
import RAGEndpointDialog from '../components/RAGEndpointDialog';

export default function AgentsPage() {
  const { t } = useTranslation();
  const { projectId } = useParams();

  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const fetchEndpoints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/projects/${projectId}/rag-testing/endpoints`);
      setEndpoints(res.data);
    } catch (error) {
      console.error('Failed to fetch endpoints:', error);
      toast.error(t('ragTesting.agents.fetchFailed', { defaultValue: 'Failed to load agents' }));
    } finally {
      setLoading(false);
    }
  }, [projectId, t]);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  const handleEdit = endpoint => {
    setEditingEndpoint(endpoint);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEndpoint(null);
    setDialogOpen(true);
  };

  const handleDialogClose = refresh => {
    setDialogOpen(false);
    setEditingEndpoint(null);
    if (refresh) {
      fetchEndpoints();
    }
  };

  const handleDelete = id => {
    setDeleteDialog({ open: true, id });
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/projects/${projectId}/rag-testing/endpoints`, {
        data: { ids: [deleteDialog.id] }
      });
      toast.success(t('ragTesting.agents.deleteSuccess', { defaultValue: 'Agent deleted' }));
      fetchEndpoints();
    } catch (error) {
      console.error('Failed to delete endpoint:', error);
      toast.error(t('ragTesting.agents.deleteFailed', { defaultValue: 'Failed to delete agent' }));
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const handleTest = async endpoint => {
    try {
      const res = await axios.post(`/api/projects/${projectId}/rag-testing/endpoints/test-connection`, {
        endpointId: endpoint.id
      });
      if (res.data.success) {
        toast.success(t('ragTesting.agents.connectionSuccess', { defaultValue: 'Connection successful' }) + `: ${res.data.message}`);
      } else {
        toast.error(t('ragTesting.agents.connectionFailed', { defaultValue: 'Connection failed' }) + `: ${res.data.message}`);
      }
      fetchEndpoints();
    } catch (error) {
      console.error('Test connection failed:', error);
      toast.error(t('ragTesting.agents.connectionFailed', { defaultValue: 'Connection failed' }));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box />
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          {t('ragTesting.agents.addAgent', { defaultValue: 'Add Agent' })}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : endpoints.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center' }}>
          <StorageIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            {t('ragTesting.agents.noAgents', { defaultValue: 'No agents configured' })}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            {t('ragTesting.agents.noAgentsHint', { defaultValue: 'Add a RAG agent endpoint to start evaluating your retrieval pipeline.' })}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} size="large">
            {t('ragTesting.agents.addAgent', { defaultValue: 'Add Agent' })}
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {endpoints.map(endpoint => (
            <Grid item xs={12} sm={6} md={4} key={endpoint.id}>
              <RAGEndpointCard
                endpoint={endpoint}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTest={handleTest}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <RAGEndpointDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        projectId={projectId}
        endpoint={editingEndpoint}
      />

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>{t('ragTesting.agents.deleteConfirmTitle', { defaultValue: 'Delete Agent' })}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('ragTesting.agents.deleteConfirmMessage', { defaultValue: 'Are you sure you want to delete this agent?' })}
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
    </Box>
  );
}
