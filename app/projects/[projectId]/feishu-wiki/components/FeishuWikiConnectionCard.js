'use client';

import { Box, Card, CardContent, Typography, Chip, Button, IconButton, CircularProgress, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ErrorIcon from '@mui/icons-material/Error';
import DescriptionIcon from '@mui/icons-material/Description';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

export default function FeishuWikiConnectionCard({ connection, onEdit, onDelete, onSync, syncing, onClick }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const getStatusConfig = status => {
    if (status === 1) {
      return {
        label: t('feishuWiki.connected', { defaultValue: 'Connected' }),
        color: 'success',
        icon: <CheckCircleIcon fontSize="small" />
      };
    }
    if (status === 2) {
      return {
        label: t('feishuWiki.connectionFailed', { defaultValue: 'Connection Failed' }),
        color: 'error',
        icon: <ErrorIcon fontSize="small" />
      };
    }
    return {
      label: t('feishuWiki.notTested', { defaultValue: 'Not Tested' }),
      color: 'default',
      icon: <HelpOutlineIcon fontSize="small" />
    };
  };

  const statusConfig = getStatusConfig(connection.status);

  const formatLastSynced = dateStr => {
    if (!dateStr) return t('feishuWiki.noDocuments', { defaultValue: 'Never' });
    return new Date(dateStr).toLocaleString();
  };

  const handleEdit = e => {
    e.stopPropagation();
    onEdit?.(connection);
  };

  const handleDelete = e => {
    e.stopPropagation();
    onDelete?.(connection);
  };

  const handleSync = e => {
    e.stopPropagation();
    onSync?.(connection);
  };

  return (
    <Card
      onClick={() => onClick?.(connection)}
      sx={{
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'scale(1.01)',
          boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent>
        {/* Top section: Name + Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, flex: 1, mr: 1 }} noWrap>
            {connection.name}
          </Typography>
          <Chip
            icon={statusConfig.icon}
            label={statusConfig.label}
            color={statusConfig.color}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Middle section: Details */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              {t('feishuWiki.spaceName', { defaultValue: 'Space' })}:
            </Typography>
            <Typography variant="body2">{connection.spaceName || '-'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              {t('feishuWiki.spaceId', { defaultValue: 'Space ID' })}:
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
              {connection.spaceId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <DescriptionIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
              {t('feishuWiki.documents', { defaultValue: 'Documents' })}:
            </Typography>
            <Typography variant="body2">{connection.documents?.length ?? 0}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
              {t('feishuWiki.lastSynced', { defaultValue: 'Last Synced' })}:
            </Typography>
            <Typography variant="body2">{formatLastSynced(connection.lastSyncedAt)}</Typography>
          </Box>
        </Box>

        {/* Bottom section: Action buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title={t('feishuWiki.edit', { defaultValue: 'Edit' })}>
              <IconButton size="small" onClick={handleEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('feishuWiki.delete', { defaultValue: 'Delete' })}>
              <IconButton
                size="small"
                onClick={handleDelete}
                sx={{
                  color: theme.palette.mode === 'dark' ? 'grey.400' : 'grey.600',
                  '&:hover': { color: 'error.main' }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
            disabled={syncing}
            onClick={handleSync}
          >
            {syncing
              ? t('feishuWiki.syncDocuments', { defaultValue: 'Syncing...' })
              : t('feishuWiki.syncNow', { defaultValue: 'Sync Now' })}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
