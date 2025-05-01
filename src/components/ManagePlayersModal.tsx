// src/components/ManagePlayersModal.tsx

import React from 'react';
import { useModals } from '@mantine/modals';
import { Button, ScrollArea, Title, Text } from '@mantine/core';
import PlayerList from './PlayerList';
import AddPlayerForm from './AddPlayerForm';

export default function ManagePlayersModal() {
  const modals = useModals();

  const open = () =>
    modals.openModal({
      title: <Title order={4}>Manage Players</Title>,
      size: 'lg',
      children: (
        <>
          <ScrollArea style={{ maxHeight: 200 }} mb="md">
            <PlayerList />
          </ScrollArea>
          <Text mb="xs">Add a new player:</Text>
          <AddPlayerForm />
        </>
      ),
    });

  return <Button onClick={open}>Manage Players</Button>;
}
