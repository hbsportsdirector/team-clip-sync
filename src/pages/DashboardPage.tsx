import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppShell,
  Group,
  Text,
  Button,
  Container,
  Loader,
  Center,
} from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/', { replace: true });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <AppShell
      padding="md"
      header={
        <AppShell.Header height={60} p="xs">
          <Group position="apart" sx={{ height: '100%' }}>
            <Text weight={700}>TeamClipSync</Text>
            <Group>
              <Text>{user.email}</Text>
              <Button variant="outline" size="sm" onClick={signOut}>
                Log out
              </Button>
            </Group>
          </Group>
        </AppShell.Header>
      }
      navbar={
        <AppShell.Navbar width={{ base: 200 }} p="xs">
          <Text size="sm" color="dimmed" mb="xs">
            Sections
          </Text>
          <Group direction="column" spacing="xs">
            <Text>• Add Player</Text>
            <Text>• Record &amp; Send</Text>
            <Text>• Upload Video</Text>
            <Text>• Trim &amp; Send</Text>
          </Group>
        </AppShell.Navbar>
      }
    >
      <Container size="lg">
        <Text size="xl" weight={500} mb="md">
          Welcome, {user.email}!
        </Text>
        <Text color="dimmed" mb="lg">
          Dashboard content goes here: camera, uploader, trimmer, player lists…
        </Text>
      </Container>
    </AppShell>
  );
}
