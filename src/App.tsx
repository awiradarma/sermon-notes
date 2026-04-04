import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LoginScreen } from './components/auth/LoginScreen';
import { LibraryView } from './components/library/LibraryView';
import { EditorView } from './components/editor/EditorView';
import { CommunityFeed } from './components/community/CommunityFeed';
import { auth } from './lib/firebase';
import { LogOut } from 'lucide-react';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [editingNoteId, setEditingNoteId] = useState<string | undefined>();

  if (!user) {
    return <LoginScreen />;
  }

  const handleEditNote = (noteId: string) => {
    setEditingNoteId(noteId);
    setActiveTab('write');
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'home' && <LibraryView onEditNote={handleEditNote} />}
      {activeTab === 'community' && <CommunityFeed />}
      {activeTab === 'write' && (
        <EditorView 
          existingNoteId={editingNoteId} 
          onSaved={() => {
            setEditingNoteId(undefined);
            setActiveTab('home');
          }} 
        />
      )}
      {activeTab === 'settings' && (
        <div className="p-8 max-w-lg mx-auto pb-20">
          <h2 className="text-3xl font-bold mb-6 text-foreground tracking-tight">Settings</h2>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-foreground border-b pb-2">Account</h3>
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground text-sm">Valid profile: <br/><span className="text-foreground font-medium text-base">{user.email}</span></p>
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="flex w-full justify-center items-center gap-2 text-destructive font-medium p-3 hover:bg-destructive/10 rounded-xl transition-colors border border-destructive/20 shadow-sm"
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
