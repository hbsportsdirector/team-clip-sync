// src/pages/DashboardPage.tsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, AppShell, Box, Center, Text } from '@mantine/core';
import { IconCamera, IconUpload, IconScissors, IconUsers } from '@tabler/icons-react';

import { useAuth } from '../contexts/AuthContext';
import { usePlayers } from '../contexts/PlayerContext';

import Camera from '../components/Camera';
import VideoUploader from '../components/VideoUploader';
import ClipTrimmer from '../components/ClipTrimmer';
import PlayerList from '../components/PlayerList';
import AddPlayerForm from '../components/AddPlayerForm';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { players } = usePlayers();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/', { replace: true });
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <Center style={{ height: '100vh' }}>
        <Text>Loading…</Text>
      </Center>
    );
  }

  // Choose default folder for upload/trim
  const defaultFolder = players[0]?.driveFolder || '';

  return (
    <AppShell
      padding={0}
      header={null}
      navbar={null}
      footer={null}
      styles={{ main: { padding: 0, minHeight: '100vh' } }}
    >
      <Tabs
        defaultValue="record"
        keepMounted={false}
        styles={(theme) => ({
          tabsList: {
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: theme.colorScheme === 'dark' 
              ? theme.colors.dark[7] 
              : theme.white,
            borderTop: `1px solid ${theme.colors.gray[4]}`,
          },
          tab: {
            flex: 1,
            padding: '8px 0',
          },
          panel: {
            paddingBottom: 60, // space for tab bar
            paddingTop: 8,
          },
        })}
      >
        {/* Tab Bar */}
        <Tabs.List grow position="center">
          <Tabs.Tab value="record" icon={<IconCamera size={20} />}>
            Record
          </Tabs.Tab>
          <Tabs.Tab value="upload" icon={<IconUpload size={20} />}>
            Upload
          </Tabs.Tab>
          <Tabs.Tab value="trim" icon={<IconScissors size={20} />}>
            Trim
          </Tabs.Tab>
          <Tabs.Tab value="players" icon={<IconUsers size={20} />}>
            Players
          </Tabs.Tab>
        </Tabs.List>

        {/* Panels */}
        <Tabs.Panel value="record" pt="md">
          <Camera />
        </Tabs.Panel>

        <Tabs.Panel value="upload" pt="md">
          {defaultFolder ? (
            <VideoUploader folderId={defaultFolder} />
          ) : (
            <Center>
              <Text color="dimmed">Add a player first to upload</Text>
            </Center>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="trim" pt="md">
          {defaultFolder ? (
            <ClipTrimmer folderId={defaultFolder} />
          ) : (
            <Center>
              <Text color="dimmed">Add a player first to trim</Text>
            </Center>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="players" pt="md">
          <Box px="sm">
            <PlayerList />
            <AddPlayerForm />
          </Box>
        </Tabs.Panel>
      </Tabs>
    </AppShell>
  );
}
