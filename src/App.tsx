import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LoginScreen } from './components/auth/LoginScreen';
import { LibraryView } from './components/library/LibraryView';
import { EditorView } from './components/editor/EditorView';
import { CommunityFeed } from './components/community/CommunityFeed';
import { auth } from './lib/firebase';
import { LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { useNotes } from './lib/hooks';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [editingNoteId, setEditingNoteId] = useState<string | undefined>();
  const { notes, removeNote } = useNotes();

  if (!user) {
    return <LoginScreen />;
  }

  const handleEditNote = (noteId: string) => {
    setEditingNoteId(noteId);
    setActiveTab('write');
  };

  const handleNewNote = () => {
    setEditingNoteId(undefined);
    setActiveTab('write');
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={(tab) => {
      if (tab === 'write') handleNewNote();
      else setActiveTab(tab);
    }}>
      {activeTab === 'home' && <LibraryView onEditNote={handleEditNote} />}
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
        <div className="p-8 max-w-lg mx-auto pb-20">
          <h2 className="text-3xl font-bold mb-6 text-foreground tracking-tight">Settings</h2>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-foreground border-b pb-2">Account</h3>
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground text-sm">Valid profile: <br/><span className="text-foreground font-medium text-base">{user.email}</span></p>
            </div>
            
            {/* Emergency Cleanup */}
            <div className="mb-6 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
              <div className="flex items-center gap-2 text-destructive mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Maintenance</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Found {notes.filter(n => n.title.includes('Test Sermon') || n.title.includes('Investigation Test')).length} duplicate test records.</p>
              <button 
                onClick={async () => {
                  const toDelete = notes.filter(n => n.title.includes('Test Sermon') || n.title.includes('Investigation Test'));
                  if (window.confirm(`Delete ${toDelete.length} duplicate test notes? This might take a moment.`)) {
                    for (const note of toDelete) {
                      if (note.docId) await removeNote(note.docId);
                    }
                    alert('Cleanup complete!');
                  }
                }}
                className="w-full flex justify-center items-center gap-2 bg-destructive text-white font-bold p-3 hover:bg-destructive/90 rounded-xl transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4" /> Purge Duplicates
              </button>
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
