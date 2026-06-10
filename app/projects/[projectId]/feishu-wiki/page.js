'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { Container, Box, Typography, Button, CircularProgress, Grid } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StorageIcon from '@mui/icons-material/Storage';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import { toast } from 'sonner';

import useFeishuWikiConnections from './hooks/useFeishuWikiConnections';
import FeishuWikiConnectionCard from './components/FeishuWikiConnectionCard';
import FeishuWikiConnectionDialog from './components/FeishuWikiConnectionDialog';

export default function FeishuWikiPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const {
    connections,
    loading,
    fetchConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
    fetchSpaces
  } = useFeishuWikiConnections();

  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  // Handler: open dialog for adding a new connection
  const handleAdd = () => {
    setEditData(null);
    setDialogOpen(true);
  };

  // Handler: open dialog for editing an existing connection
  const handleEdit = connection => {
    setEditData(connection);
    setDialogOpen(true);
  };

  // Handler: delete a connection with confirmation
  const handleDelete = async connection => {
    const confirmed = window.confirm(t('feishuWiki.deleteConfirm', { defaultValue: 'Are you sure you want to delete this connection?' }));
    if (!confirmed) return;
    try {
      await deleteConnection([connection.id]);
    } catch (error) {
      // Error toast is handled in the hook
    }
  };

  // Handler: navigate to connection detail page for full sync
  const handleSync = connection => {
    router.push(`/projects/${projectId}/feishu-wiki/${connection.id}`);
  };

  // Handler: save (create or update) a connection
  const handleSave = async data => {
    try {
      if (editData) {
        await updateConnection(editData.id, data);
      } else {
        await createConnection(data);
      }
      handleDialogClose();
    } catch (error) {
      // Error toast is handled in the hook
    }
  };

  // Handler: close dialog and reset edit data
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  // Handler: click on a connection card (navigate to detail)
  const handleCardClick = connection => {
    router.push(`/projects/${projectId}/feishu-wiki/${connection.id}`);
  };

  // Track which connection is currently syncing (for the card spinner)
  // In this list page, sync navigates away, so syncingId is kept for future
  // inline sync support. For now, the sync button navigates to the detail page.

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      {/* Header row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StorageIcon sx={{ fontSize: 32, color: theme.palette.mode === 'dark' ? 'grey.400' : 'grey.700' }} />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            {t('feishuWiki.title', { defaultValue: 'Feishu Wiki' })}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          {t('feishuWiki.addConnection', { defaultValue: 'Add Connection' })}
        </Button>
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress size={48} />
        </Box>
      ) : connections.length === 0 ? (
        /* Empty state */
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
            gap: 2
          }}
        >
          <CloudOffIcon sx={{ fontSize: 80, color: theme.palette.mode === 'dark' ? 'grey.500' : 'grey.300' }} />
          <Typography variant="h6" color="text.secondary">
            {t('feishuWiki.noConnections', { defaultValue: 'No Feishu Wiki connections yet' })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('feishuWiki.noConnectionsHint', { defaultValue: 'Add a connection to start importing documents from Feishu Wiki' })}
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ mt: 1 }}>
            {t('feishuWiki.addConnection', { defaultValue: 'Add Connection' })}
          </Button>
        </Box>
      ) : (
        /* Connection cards grid */
        <Grid container spacing={3}>
          {connections.map(connection => (
            <Grid item xs={12} sm={6} md={4} key={connection.id}>
              <FeishuWikiConnectionCard
                connection={connection}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSync={handleSync}
                syncing={syncingId === connection.id}
                onClick={handleCardClick}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Connection dialog (add / edit) */}
      <FeishuWikiConnectionDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSave={handleSave}
        editData={editData}
        testConnection={testConnection}
        fetchSpaces={fetchSpaces}
      />
    </Container>
  );
}