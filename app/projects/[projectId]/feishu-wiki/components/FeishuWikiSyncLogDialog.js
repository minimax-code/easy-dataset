'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Box,
  Typography
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import CancelIcon from '@mui/icons-material/Cancel';
import InboxIcon from '@mui/icons-material/Inbox';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

export default function FeishuWikiSyncLogDialog({ open, onClose, syncLogs, syncLogsTotal, loading }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const getSyncStatusConfig = status => {
    switch (status) {
      case 1:
        return {
          label: t('feishuWiki.status', { defaultValue: 'Completed' }),
          color: 'success',
          icon: <CheckCircleIcon sx={{ fontSize: 14 }} />
        };
      case 0:
        return {
          label: t('feishuWiki.status', { defaultValue: 'Processing' }),
          color: 'warning',
          icon: <PendingIcon sx={{ fontSize: 14 }} />
        };
      case 2:
        return {
          label: t('feishuWiki.status', { defaultValue: 'Failed' }),
          color: 'error',
          icon: <ErrorIcon sx={{ fontSize: 14 }} />
        };
      case 3:
        return {
          label: t('feishuWiki.cancel', { defaultValue: 'Cancelled' }),
          color: 'default',
          icon: <CancelIcon sx={{ fontSize: 14 }} />
        };
      default:
        return {
          label: t('feishuWiki.status', { defaultValue: 'Unknown' }),
          color: 'default',
          icon: null
        };
    }
  };

  const formatDuration = (startedAt, completedAt) => {
    if (!startedAt) return '-';
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const diffMs = end - start;
    if (diffMs < 1000) return `${diffMs}ms`;
    if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
    return `${(diffMs / 60000).toFixed(1)}m`;
  };

  const formatTime = dateStr => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('feishuWiki.syncLogs', { defaultValue: 'Sync Logs' })}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : !syncLogs || syncLogs.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 6,
              color: 'text.secondary'
            }}
          >
            <InboxIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
            <Typography variant="body1">No sync history yet</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Typography variant="caption" fontWeight="bold">
                      Time
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontWeight="bold">
                      {t('feishuWiki.status', { defaultValue: 'Status' })}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" fontWeight="bold">
                      Total Nodes
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" fontWeight="bold">
                      Synced
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" fontWeight="bold">
                      Failed
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="caption" fontWeight="bold">
                      Duration
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {syncLogs.map(log => {
                  const statusConfig = getSyncStatusConfig(log.status);
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                          {formatTime(log.startedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusConfig.icon}
                          label={statusConfig.label}
                          size="small"
                          color={statusConfig.color}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{log.totalNodes}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="success.main">
                          {log.syncedNodes}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color={log.failedNodes > 0 ? 'error.main' : 'text.primary'}>
                          {log.failedNodes}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                          {formatDuration(log.startedAt, log.completedAt)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
  );
}
