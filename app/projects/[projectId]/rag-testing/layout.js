'use client';

import { Box, Container, Tabs, Tab, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useParams, usePathname } from 'next/navigation';

export default function RAGTestingLayout({ children }) {
  const { t } = useTranslation();
  const { projectId } = useParams();
  const pathname = usePathname();

  const basePath = `/projects/${projectId}/rag-testing`;

  let activeTab = 0;
  if (pathname.startsWith(`${basePath}/evaluations`)) {
    activeTab = 1;
  } else if (pathname.startsWith(`${basePath}/agents`)) {
    activeTab = 2;
  }

  const tabs = [
    { label: t('ragTesting.tabs.testSets', { defaultValue: 'Test Sets' }), href: basePath },
    { label: t('ragTesting.tabs.evaluations', { defaultValue: 'Evaluations' }), href: `${basePath}/evaluations` },
    { label: t('ragTesting.tabs.agents', { defaultValue: 'Agents' }), href: `${basePath}/agents` }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {t('ragTesting.title')}
      </Typography>
      <Tabs
        value={activeTab}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        {tabs.map((tab, i) => (
          <Tab
            key={i}
            label={tab.label}
            href={tab.href}
            component="a"
            value={i}
          />
        ))}
      </Tabs>
      {children}
    </Container>
  );
}
