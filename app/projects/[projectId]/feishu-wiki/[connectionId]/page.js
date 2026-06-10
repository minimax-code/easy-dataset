'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import {
  Container,
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Paper,
  Grid,
  Divider,
  CircularProgress,
  Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SyncIcon from '@mui/icons-material/Sync';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ErrorIcon from '@mui/icons-material/Error';
import DescriptionIcon from '@mui/icons-material/Description';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { toast } from 'sonner';

import useFeishuWikiConnections from '../hooks/useFeishuWikiConnections';
import useFeishuWikiDocuments from '../hooks/useFeishuWikiDocuments';
import useFeishuWikiSync from '../hooks/useFeishuWikiSync';
import useFeishuWikiProcess from '../hooks/useFeishuWikiProcess';
import FeishuWikiDocumentList from '../components/FeishuWikiDocumentList';
import FeishuWikiSyncLogDialog from '../components/FeishuWikiSyncLogDialog';

export default function ConnectionDetailPage() {
  const { projectId, connectionId } = useParams();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();

  const { connections, fetchConnections, deleteConnection } = useFeishuWikiConnections();
  const { documents, total, loading: docsLoading, page, pageSize, setPage, fetchDocuments } = useFeishuWikiDocuments(connectionId);
  const { syncing, triggerSync, syncLogs, syncLogsTotal, fetchSyncLogs } = useFeishuWikiSync(connectionId);
  const { processing, processDocuments } = useFeishuWikiProcess(connectionId);

  const prevProcessingRef = useRef(false);

  const connection = connections.find(c => c.id === connectionId);
  const [syncLogOpen, setSyncLogOpen] = useState(false);
  const [syncLogsLoading, setSyncLogsLoading] = useState(false);
  const prevSyncingRef = useRef(false);

  // Refresh documents when sync completes (syncing transitions from true to false)
  useEffect(() => {
    if (prevSyncingRef.current && !syncing) {
      fetchDocuments();
      fetchConnections();
    }
    prevSyncingRef.current = syncing;
  }, [syncing, fetchDocuments, fetchConnections]);

  // Refresh when document processing completes
  useEffect(() => {
    if (prevProcessingRef.current && !processing) {
      fetchDocuments();
    }
    prevProcessingRef.current = processing;
  }, [processing, fetchDocuments]);

  const getStatusConfig = status => {
    if (status === 1) {
      return {
        label: t('feishuWiki.connected'),
        color: 'success',
        icon: <CheckCircleIcon fontSize="small" />
      };
    }
    if (status === 2) {
      return {
        label: t('feishuWiki.connectionFailed'),
        color: 'error',
        icon: <ErrorIcon fontSize="small" />
      };
    }
    return {
      label: t('feishuWiki.notTested'),
      color: 'default',
      icon: <HelpOutlineIcon fontSize="small" />
    };
  };

  const handleSync = useCallback(async () => {
    try {
      await triggerSync();
      toast.success(t('feishuWiki.syncDocuments'));
    } catch {
      // Error toast is handled by the hook
    }
  }, [triggerSync, t]);

  const handleBack = useCallback(() => {
    router.push(`/projects/${projectId}/feishu-wiki`);
  }, [router, projectId]);

  const handleDelete = useCallback(async () => {
    if (!connection) return;
    if (!window.confirm(t('feishuWiki.deleteConfirm'))) return;
    try {
      await deleteConnection([connection.id]);
      router.push(`/projects/${projectId}/feishu-wiki`);
    } catch {
      // Error toast is handled by the hook
    }
  }, [connection, deleteConnection, router, projectId, t]);

  const handleOpenSyncLogs = useCallback(async () => {
    setSyncLogOpen(true);
    setSyncLogsLoading(true);
    try {
      await fetchSyncLogs(1);
    } finally {
      setSyncLogsLoading(false);
    }
  }, [fetchSyncLogs]);

  const handleCloseSyncLogs = useCallback(() => {
    setSyncLogOpen(false);
  }, []);

  const handlePageChange = useCallback(newPage => {
    setPage(newPage);
  }, [setPage]);

  const handleSmartSplit = useCallback(
    async (documentIds, domainTreeAction) => {
      try {
        await processDocuments(documentIds, domainTreeAction);
      } catch {
        // Error toast handled by hook
      }
    },
    [processDocuments]
  );

  const formatLastSynced = dateStr => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  // Loading state while connection data is being fetched
  if (!connection && connections.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!connection) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={600}>
            {t('feishuWiki.notFound', { defaultValue: 'Connection not found' })}
          </Typography>
        </Box>
      </Container>
    );
  }

  const statusConfig = getStatusConfig(connection.status);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Top bar / breadcrumb */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h5" fontWeight={600} sx={{ flex: '0 1 auto', mr: 2 }} noWrap>
          {connection.name}
        </Typography>

        <Chip
          icon={statusConfig.icon}
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
          variant="outlined"
          sx={{ mr: 'auto' }}
        />

        <Button
          variant="contained"
          startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
          disabled={syncing}
          onClick={handleSync}
          size="small"
        >
          {syncing ? t('feishuWiki.syncDocuments') : t('feishuWiki.syncNow')}
        </Button>

        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={handleOpenSyncLogs}
          size="small"
        >
          {t('feishuWiki.syncLogs')}
        </Button>

        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          size="small"
        >
          {t('feishuWiki.edit')}
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={handleDelete}
          size="small"
        >
          {t('feishuWiki.delete')}
        </Button>
      </Box>

      {/* Connection info section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          borderRadius: 2
        }}
      >
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          {t('feishuWiki.editConnection', { defaultValue: 'Connection Details' })}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('feishuWiki.appId')}:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {connection.appId || '-'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('feishuWiki.spaceId')}:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {connection.spaceId || '-'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {t('feishuWiki.spaceName')}:
              </Typography>
              <Typography variant="body2">{connection.spaceName || '-'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {t('feishuWiki.lastSynced')}:
              </Typography>
              <Typography variant="body2">{formatLastSynced(connection.lastSyncedAt)}</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Documents section */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <DescriptionIcon sx={{ color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight={600}>
            {t('feishuWiki.documents')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({total})
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <FeishuWikiDocumentList
          documents={documents}
          total={total}
          loading={docsLoading}
          page={page}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onSmartSplit={handleSmartSplit}
          processing={processing}
        />
      </Paper>

      {/* Sync logs dialog */}
      <FeishuWikiSyncLogDialog
        open={syncLogOpen}
        onClose={handleCloseSyncLogs}
        syncLogs={syncLogs}
        syncLogsTotal={syncLogsTotal}
        loading={syncLogsLoading}
      />
    </Container>
  );
}
