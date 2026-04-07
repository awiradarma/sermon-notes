import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LoginScreen } from './components/auth/LoginScreen';
import { LibraryView } from './components/library/LibraryView';
import { EditorView } from './components/editor/EditorView';
import { CommunityFeed } from './components/community/CommunityFeed';
import { GraphView } from './components/graph/GraphView';
import { auth } from './lib/firebase';
import { LogOut } from 'lucide-react';function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [editingNoteId, setEditingNoteId] = useState<string | undefined>();

  const handleEditNote = (noteId: string) => {
    setEditingNoteId(noteId);
    setActiveTab('write');
  };

  const handleNewNote = () => {
    setEditingNoteId(undefined);
    setActiveTab('write');
  };

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <AppShell activeTab={activeTab} setActiveTab={(tab) => {
      if (tab === 'write') handleNewNote();
      else setActiveTab(tab);
    }}>
      {activeTab === 'home' && <LibraryView onEditNote={handleEditNote} />}
      {activeTab === 'graph' && <GraphView onNodeClick={(noteId) => handleEditNote(noteId)} />}
      {activeTab === 'community' && <CommunityFeed />}
      {activeTab === 'write' && (
        <EditorView 
          existingNoteId={editingNoteId} 
          onNoteCreated={(id) => setEditingNoteId(id)}
          onSaved={() => {
            setEditingNoteId(undefined);
            setActiveTab('home');
          }} 
        />
      )}
      {activeTab === 'settings' && (
        <div className="flex-1 min-h-0 overflow-y-auto w-full p-8 max-w-lg mx-auto pb-20">
          <h2 className="text-3xl font-bold mb-6 text-foreground tracking-tight">Settings</h2>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-foreground border-b pb-2">Account</h3>
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground text-sm">Valid profile: <br/><span className="text-foreground font-medium text-base">{user.email}</span></p>
              <p className="text-muted-foreground text-sm text-right">App Version: <br/><span className="text-foreground font-medium text-base">v{import.meta.env.VITE_APP_VERSION || "1.0.0"}</span></p>
            </div>
            
            <button 
              onClick={() => auth.signOut()}
              className="flex w-full justify-center items-center gap-2 text-muted-foreground font-medium p-3 hover:bg-muted rounded-xl transition-colors border border-border"
            >
              <LogOut className="w-5 h-5" /> Sign Out from Sanctuary
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
