'use client';

import {
  Box,
  Typography,
  Chip,
  Pagination,
  CircularProgress,
  Stack,
  Divider,
  Checkbox,
  Button,
  Toolbar,
  Tooltip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import UpdateIcon from '@mui/icons-material/Update';
import InboxIcon from '@mui/icons-material/Inbox';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

export default function FeishuWikiDocumentList({
  documents,
  total,
  loading,
  page,
  pageSize,
  onPageChange,
  onSmartSplit,
  processing
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedIds, setSelectedIds] = useState([]);
  const [domainTreeAction, setDomainTreeAction] = useState('keep');

  const getSyncStatusConfig = syncStatus => {
    switch (syncStatus) {
      case 1:
        return {
          label: 'Synced',
          color: 'success',
          icon: <CheckCircleIcon sx={{ fontSize: 14 }} />
        };
      case 2:
        return {
          label: 'Failed',
          color: 'error',
          icon: <ErrorIcon sx={{ fontSize: 14 }} />
        };
      case 3:
        return {
          label: 'Stale',
          color: 'warning',
          icon: <UpdateIcon sx={{ fontSize: 14 }} />
        };
      default:
        return {
          label: 'Pending',
          color: 'default',
          icon: <PendingIcon sx={{ fontSize: 14 }} />
        };
    }
  };

  const docIds = useMemo(() => (documents || []).map(d => d.id), [documents]);

  const allSelected = docIds.length > 0 && docIds.every(id => selectedIds.includes(id));
  const someSelected = selectedIds.length > 0 && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...docIds]);
    }
  };

  const handleToggle = id => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSmartSplit = () => {
    if (onSmartSplit && selectedIds.length > 0) {
      onSmartSplit(selectedIds, domainTreeAction);
    }
  };

  const grouped = (documents || []).reduce((acc, doc) => {
    const folder = doc.folderPath || '/';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(doc);
    return acc;
  }, {});

  const totalPages = Math.ceil((total || 0) / (pageSize || 10));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!documents || documents.length === 0) {
    return (
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
        <Typography variant="body1">
          {t('feishuWiki.noDocuments', { defaultValue: 'No documents yet' })}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Action Toolbar */}
      <Toolbar
        variant="dense"
        sx={{
          px: 1,
          mb: 1,
          borderRadius: 1,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          minHeight: 40
        }}
      >
        <Tooltip title={allSelected ? t('feishuWiki.deselectAll', { defaultValue: 'Deselect All' }) : t('feishuWiki.selectAll', { defaultValue: 'Select All' })}>
          <IconButton onClick={handleSelectAll} size="small" sx={{ mr: 1 }}>
            {allSelected ? <CheckBoxIcon color="primary" /> : someSelected ? <CheckBoxIcon color="primary" /> : <CheckBoxOutlineBlankIcon />}
          </IconButton>
        </Tooltip>

        {selectedIds.length > 0 ? (
          <Typography variant="body2" sx={{ mr: 2, color: 'primary.main', fontWeight: 500 }}>
            {t('feishuWiki.selectedCount', { defaultValue: '{{count}} selected', count: selectedIds.length }).replace('{{count}}', selectedIds.length)}
          </Typography>
        ) : (
          <Typography variant="body2" sx={{ mr: 2, color: 'text.secondary' }}>
            {t('feishuWiki.selectDocuments', { defaultValue: 'Select documents to process' })}
          </Typography>
        )}

        <Box sx={{ flex: 1 }} />

        <FormControl size="small" sx={{ mr: 1, minWidth: 100 }}>
          <InputLabel>{t('feishuWiki.domainTreeAction', { defaultValue: 'Domain Tree' })}</InputLabel>
          <Select
            value={domainTreeAction}
            label={t('feishuWiki.domainTreeAction', { defaultValue: 'Domain Tree' })}
            onChange={e => setDomainTreeAction(e.target.value)}
          >
            <MenuItem value="keep">{t('feishuWiki.domainKeep', { defaultValue: 'Keep' })}</MenuItem>
            <MenuItem value="rebuild">{t('feishuWiki.domainRebuild', { defaultValue: 'Rebuild' })}</MenuItem>
            <MenuItem value="revise">{t('feishuWiki.domainRevise', { defaultValue: 'Revise' })}</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          size="small"
          startIcon={<CallSplitIcon />}
          onClick={handleSmartSplit}
          disabled={selectedIds.length === 0 || processing}
        >
          {processing
            ? t('feishuWiki.processing', { defaultValue: 'Processing...' })
            : t('feishuWiki.smartSplit', { defaultValue: 'Smart Split' })}
        </Button>
      </Toolbar>

      {/* Document list grouped by folder */}
      {Object.entries(grouped).map(([folder, docs]) => (
        <Box key={folder} sx={{ mb: 3 }}>
          {/* Folder group header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 1,
              px: 1.5,
              borderRadius: 1,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              mb: 1
            }}
          >
            <FolderIcon sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {folder}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ({docs.length})
            </Typography>
          </Box>

          {/* Document items */}
          <Stack divider={<Divider flexItem />} sx={{ pl: 1 }}>
            {docs.map(doc => {
              const statusConfig = getSyncStatusConfig(doc.syncStatus);
              return (
                <Box
                  key={doc.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.5,
                    px: 1.5,
                    borderRadius: 0.5,
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                    <Checkbox
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => handleToggle(doc.id)}
                      size="small"
                      sx={{ flexShrink: 0 }}
                    />
                    <DescriptionIcon sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }} />
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                      {doc.title}
                    </Typography>
                    <Chip
                      label={doc.objType || 'docx'}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 20, flexShrink: 0 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 2, flexShrink: 0 }}>
                    <Chip
                      icon={statusConfig.icon}
                      label={statusConfig.label}
                      size="small"
                      color={statusConfig.color}
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: 22 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      {doc.lastSyncedAt ? new Date(doc.lastSyncedAt).toLocaleString() : '-'}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page || 1}
            onChange={(e, newPage) => onPageChange?.(newPage)}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
