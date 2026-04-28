import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LoginScreen } from './components/auth/LoginScreen';
import { LibraryView } from './components/library/LibraryView';
import { InsightsView } from './components/library/InsightsView';
import { EditorView } from './components/editor/EditorView';
import { CommunityFeed } from './components/community/CommunityFeed';
import { GraphView } from './components/graph/GraphView';
import { auth } from './lib/firebase';
import { LogOut } from 'lucide-react';function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(user ? 'home' : 'community');
  const [editingNoteId, setEditingNoteId] = useState<string | undefined>();
  const [preferredBibleId, setPreferredBibleId] = useState(() => localStorage.getItem('preferredBibleId') || '9879dbb7cfe39e4d-01');

  const handleSaveBiblePrefs = (val: string) => {
    localStorage.setItem('preferredBibleId', val);
    setPreferredBibleId(val);
  };

  const handleEditNote = (noteId: string) => {
    setEditingNoteId(noteId);
    setActiveTab('write');
  };

  const handleNewNote = () => {
    setEditingNoteId(undefined);
    setActiveTab('write');
  };

  const requireAuth = (component: React.ReactNode) => {
    return user ? component : <LoginScreen />;
  };

  return (
    <AppShell activeTab={activeTab} setActiveTab={(tab) => {
      if (tab === 'write') handleNewNote();
      else setActiveTab(tab);
    }}>
      {activeTab === 'home' && requireAuth(<LibraryView onEditNote={handleEditNote} />)}
      {activeTab === 'insights' && requireAuth(<InsightsView />)}
      {activeTab === 'graph' && <GraphView publicMode={!user} onNodeClick={user ? (noteId) => handleEditNote(noteId) : undefined} />}
      {activeTab === 'community' && <CommunityFeed />}
      {activeTab === 'write' && requireAuth(
        <EditorView 
          existingNoteId={editingNoteId} 
          onNoteCreated={(id) => setEditingNoteId(id)}
          onSaved={() => {
            setEditingNoteId(undefined);
            setActiveTab('home');
          }} 
        />
      )}
      {activeTab === 'settings' && requireAuth(
        <div className="flex-1 min-h-0 overflow-y-auto w-full p-8 max-w-lg mx-auto pb-20">
          <h2 className="text-3xl font-bold mb-6 text-foreground tracking-tight">Settings</h2>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-foreground border-b pb-2">Account</h3>
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground text-sm">Valid profile: <br/><span className="text-foreground font-medium text-base">{user?.email}</span></p>
              <p className="text-muted-foreground text-sm text-right">App Version: <br/><span className="text-foreground font-medium text-base">v{import.meta.env.VITE_APP_VERSION || "1.0.0"}</span></p>
            </div>
            
            <div className="mb-6 pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-2 text-foreground">Bible API Integration</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Bible passages are auto-populated using <code>api.bible</code>.<br/>
              </p>
              
              <div className="mt-3">
                <label className="block text-sm font-medium text-foreground mb-1">Preferred Translation</label>
                <select 
                  value={preferredBibleId}
                  onChange={(e) => handleSaveBiblePrefs(e.target.value)}
                  className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="9879dbb7cfe39e4d-01">WEB (World English Bible)</option>
                  <option value="06125adad2d5898a-01">ASV (American Standard Version)</option>
                  <option value="de4e12af7f28f599-01">KJV (King James Version)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-2">Any existing generated notes will keep their original translation.</p>
              </div>
            </div>

            <button 
              onClick={() => auth.signOut()}
              className="flex w-full justify-center items-center gap-2 text-muted-foreground font-medium p-3 hover:bg-destructive/10 hover:text-destructive rounded-xl transition-colors border border-border"
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
