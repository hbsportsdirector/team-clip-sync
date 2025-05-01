import React from 'react';
import { Center, Text, Button } from '@mantine/core';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <Center style={{ height: '100vh', flexDirection: 'column' }}>
      <Text size="xl" mb="md">
        404 – Page Not Found
      </Text>
      <Button component={Link} to="/" variant="outline">
        Go to Login
      </Button>
    </Center>
  );
}
