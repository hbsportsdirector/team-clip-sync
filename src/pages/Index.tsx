
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import PlayerList from '@/components/PlayerList';
import AddPlayerForm from '@/components/AddPlayerForm';
import ManagePlayersModal from '@/components/ManagePlayersModal';
import Camera from '@/components/Camera';
import { Separator } from '@/components/ui/separator';
import { Play } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b bg-card">
        <div className="container max-w-md px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-team-primary">TeamClipSync</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/video')}
              className="flex items-center gap-1"
            >
              <Play className="h-4 w-4" /> Video
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-md px-4 py-6">
        <Tabs defaultValue="record" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="record">Record</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
          </TabsList>
          
          <TabsContent value="record" className="space-y-4">
            <Camera />
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Selected Players</h3>
              <PlayerList />
            </div>
          </TabsContent>
          
          <TabsContent value="players" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Players</h2>
              <ManagePlayersModal />
            </div>
            
            <AddPlayerForm />
            
            <Separator />
            
            <PlayerList />
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-card py-3 px-4">
        <div className="container max-w-md text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} TeamClipSync
        </div>
      </footer>
    </div>
  );
};

export default Index;
