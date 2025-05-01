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
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  console.log('🖌️ Mantine LoginPage rendering');
// Stubbed auth for now
function useAuth() {
  return {
    signInWithGoogle: () => alert('Google sign-in'),
    signInWithEmail: async () => alert('Email sign-in'),
    signUpWithEmail: async () => alert('Email sign-up'),
    isLoading: false,
    authError: '',
  };
}
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    isLoading,
    authError,
  } = useAuth();

  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');

  const submit = async () => {
    if (tab === 'login') {
      await signInWithEmail(email, pw);
    } else {
      if (pw !== confirm) return alert('Passwords must match');
      await signUpWithEmail(email, pw);
    }
  };

  return (
    <Box
      sx={(t) => ({
        minHeight: '100vh',
        background: t.fn.linearGradient(180, '#000022', '#2978A0'),
      })}
    >
      <Center style={{ height: '100vh' }}>
        <Paper
          radius="md"
          p="xl"
          withBorder
          shadow="xl"
          sx={{
            width: 340,
            maxWidth: '100%',
            background: 'rgba(20,20,30,0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Group position="center" mb="xs">
            <Title order={2} color="white">
              TeamClipSync
            </Title>
          </Group>
          <Text color="gray.4" align="center" mb="lg">
            Record videos and sync to Google Drive
          </Text>

          <Tabs value={tab} onChange={setTab} mb="md">
            <Tabs.Tab value="login">Login</Tabs.Tab>
            <Tabs.Tab value="signup">Sign Up</Tabs.Tab>
          </Tabs>

          {authError && <Alert color="red">{authError}</Alert>}

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
            value={pw}
            onChange={(e) => setPw(e.currentTarget.value)}
            mb="sm"
            required
          />
          {tab === 'signup' && (
            <PasswordInput
              label="Confirm Password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.currentTarget.value)}
              mb="sm"
              required
            />
          )}

          <Button fullWidth mt="md" onClick={submit} loading={isLoading}>
            {tab === 'login' ? 'Login' : 'Create Account'}
          </Button>

          <Divider label="Or continue with" labelPosition="center" my="lg" />

          <Button
            fullWidth
            variant="outline"
            leftSection={<FcGoogle size={20} />}
            onClick={signInWithGoogle}
            loading={isLoading}
          >
            Sign in with Google
          </Button>

          <Text size="xs" color="gray.4" align="center" mt="sm">
            Signing in with Google will request permission to access your Drive
            folders for easy folder selection when adding players.
          </Text>
        </Paper>
      </Center>
    </Box>
  );
}
