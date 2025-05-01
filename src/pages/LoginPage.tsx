// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import {
  Box,
  Center,
  Paper,
  Title,
  Text,
  Tabs,
  TextInput,
  PasswordInput,
  Button,
  Divider,
  Group,
  Alert,
} from '@mantine/core';
import { FcGoogle } from 'react-icons/fc';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, isLoading, authError, user } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // If already logged in, redirect via <Navigate>
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async () => {
    await signInWithEmail(email, password);
  };

  return (
    <Box
      sx={(theme) => ({
        minHeight: '100vh',
        background:
          theme.colorScheme === 'dark'
            ? theme.fn.linearGradient(180, '#000022', '#2978A0')
            : theme.fn.linearGradient(180, '#FFFCF2', '#A28F9D'),
      })}
    >
      <Center style={{ height: '100vh' }}>
        <Paper
          radius="md"
          p="xl"
          withBorder
          shadow="xl"
          sx={(theme) => ({
            width: 340,
            maxWidth: '100%',
            background:
              theme.colorScheme === 'dark'
                ? 'rgba(20, 20, 30, 0.7)'
                : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(8px)',
          })}
        >
          <Group position="center" mb="xs">
            <Title order={2}>TeamClipSync</Title>
          </Group>
          <Text color="dimmed" size="sm" align="center" mb="lg">
            Record videos and sync to Google Drive
          </Text>

          <Tabs value={tab} onChange={setTab} mb="md">
            <Tabs.Tab value="login">Login</Tabs.Tab>
            <Tabs.Tab value="signup">Sign Up</Tabs.Tab>
          </Tabs>

          {authError && (
            <Alert color="red" mb="sm">
              {authError.message ?? 'Authentication error'}
            </Alert>
          )}

          <TextInput
            label="Email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            mb="sm"
            required
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            mb="sm"
            required
          />

          <Button fullWidth mt="md" onClick={handleSubmit} loading={isLoading}>
            {tab === 'login' ? 'Login' : 'Sign Up'}
          </Button>

          <Button
            fullWidth
            mt="xs"
            variant="outline"
            leftSection={<FcGoogle size={20} />}
            onClick={signInWithGoogle}
            loading={isLoading}
          >
            Continue with Google
          </Button>

          <Divider label="Or" labelPosition="center" my="lg" />

          <Text size="xs" align="center">
            {tab === 'login' ? (
              <>
                Don’t have an account? <Link to="/signup">Sign up</Link>
              </>
            ) : (
              <>
                Already have an account? <Link to="/">Log in</Link>
              </>
            )}
          </Text>
        </Paper>
      </Center>
    </Box>
  );
}
