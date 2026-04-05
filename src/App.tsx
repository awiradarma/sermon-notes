import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { AuthProvider, useAuth } from './components/auth/AuthProvider';
import { LoginScreen } from './components/auth/LoginScreen';
import { LibraryView } from './components/library/LibraryView';
import { EditorView } from './components/editor/EditorView';
import { CommunityFeed } from './components/community/CommunityFeed';
import { auth } from './lib/firebase';
import { LogOut, Upload, Database } from 'lucide-react';
import { useNotes } from './lib/hooks';

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [editingNoteId, setEditingNoteId] = useState<string | undefined>();
  const { addNote } = useNotes();
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  const handleEditNote = (noteId: string) => {
    setEditingNoteId(noteId);
    setActiveTab('write');
  };

  const handleNewNote = () => {
    setEditingNoteId(undefined);
    setActiveTab('write');
  };

  const handleCapacitiesImport = async (files: FileList) => {
    setImporting(true);
    setImportProgress({ current: 0, total: files.length });
    
    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        const text = await file.text();
        const isCSV = file.name.toLowerCase().endsWith('.csv');
        
        if (isCSV) {
          // Robust CSV Parser (handles quotes and semicolons)
          const rows: string[][] = [];
          const lines = text.split(/\r?\n/);
          lines.forEach(line => {
            if (!line.trim()) return;
            const matches = line.match(/(".*?"|[^";\s]+)(?=\s*;|\s*$)/g);
            if (matches) rows.push(matches.map(m => m.replace(/^"|"$/g, '').trim()));
          });

          if (rows.length < 2) continue;
          const headers = rows[0].map(h => h.toLowerCase());
          
          for (let r = 1; r < rows.length; r++) {
            const row = rows[r];
            const getVal = (possibleHeaders: string[]) => {
              const idx = headers.findIndex(h => possibleHeaders.includes(h));
              return idx !== -1 ? row[idx] : undefined;
            };

            const title = getVal(['title', 'name', 'headline']) || `Imported Note ${r}`;
            const content = getVal(['content', 'body', 'text', 'notes']) || '';
            const preacher = getVal(['preacher', 'speaker', 'author']) || '';
            const rawDate = getVal(['date', 'sermondate', 'created', 'date created']) || new Date().toISOString();
            const tags = (getVal(['tags', 'categories']) || '').split(/[,;]/).map(t => t.trim().replace(/^#/, '')).filter(Boolean);
            
            const sermonDate = new Date(rawDate);

            await addNote({
              title,
              preacher,
              sermonDate: isFinite(sermonDate.getTime()) ? sermonDate : new Date(),
              content,
              tags,
              verses: [],
              isPublic: false,
              imageUrls: [],
            });
          }
        } else {
          // Basic YAML Frontmatter Parser (Markdown)
          const frontmatterMatch = text.match(/^---\s*([\s\S]*?)\s*---/);
          const body = text.replace(/^---\s*[\s\S]*?\s*---/, '').trim();
          const properties: Record<string, any> = {};
          
          if (frontmatterMatch) {
            const lines = frontmatterMatch[1].split('\n');
            lines.forEach(line => {
              const [key, ...valParts] = line.split(':');
              if (key && valParts.length > 0) {
                let val = valParts.join(':').trim();
                val = val.replace(/^["']|["']$/g, '');
                if (val.startsWith('[') && val.endsWith(']')) {
                  properties[key.trim()] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
                } else {
                  properties[key.trim()] = val;
                }
              }
            });
          }

          // Extract Preacher from Markdown Link: [Name](../People/Name.md)
          const preacherMatch = body.match(/### Preacher\s*\n\s*\n\s*\[([^\]]+)\]\(\.\.\/People\//);
          const preacher = properties.preacher || properties.speaker || (preacherMatch ? preacherMatch[1] : '');
          
          // Isolate Content: Everything under ### Content or the rest of the file
          let content = body;
          if (body.includes('### Content')) {
            content = body.split('### Content')[1].trim();
          } else if (preacherMatch) {
            // Remove preacher section if it was matched but no ### Content header
            content = body.replace(/### Preacher[\s\S]*?(\n\n|$)/, '').trim();
          }

          const title = properties.title || file.name.replace('.md', '');
          const rawDate = properties.date || properties.sermonDate || new Date().toISOString();
          const sermonDate = new Date(rawDate);
          const tags = Array.isArray(properties.tags) ? properties.tags : (properties.tags ? properties.tags.split(',').map((s: string) => s.trim()) : []);
          const verses = Array.isArray(properties.verses) ? properties.verses : (properties.verses ? properties.verses.split(',').map((s: string) => s.trim()) : []);

          await addNote({
            title,
            preacher,
            sermonDate: isFinite(sermonDate.getTime()) ? sermonDate : new Date(),
            content,
            tags: tags.map((t: string) => t.replace(/^#/, '')),
            verses,
            isPublic: false,
            imageUrls: [],
          });
        }
        
        setImportProgress(prev => ({ ...prev, current: i + 1 }));
      } catch (err) {
        console.error(`Failed to import ${files[i].name}:`, err);
      }
    }
    
    setImporting(false);
    alert(`Successfully imported ${files.length} notes!`);
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
            </div>
            
            {/* Capacities Migration */}
            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Database className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Data Migration</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Export your sermon notes from <strong>Capacities</strong> as Markdown or CSV and upload them here to migrate your library.</p>
              
              {importing ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-primary italic">
                    <span>Importing data...</span>
                    <span>{Math.round((importProgress.current / importProgress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden border border-border">
                    <div 
                      className="bg-primary h-full transition-all duration-300 shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" 
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-center text-muted-foreground">{importProgress.current} of {importProgress.total} processed</p>
                </div>
              ) : (
                <label className="cursor-pointer group">
                  <input 
                    type="file" 
                    multiple 
                    accept=".md,.csv" 
                    className="hidden" 
                    onChange={(e) => e.target.files && handleCapacitiesImport(e.target.files)}
                  />
                  <div className="w-full flex justify-center items-center gap-2 bg-background border-2 border-dashed border-border text-foreground font-bold p-6 hover:border-primary/50 hover:bg-primary/5 rounded-xl transition-all group-active:scale-[0.98] shadow-sm">
                    <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    <div className="flex flex-col items-start leading-tight">
                      <span>Import from Capacities</span>
                      <span className="text-[10px] font-normal text-muted-foreground group-hover:text-primary/70 transition-colors">Select .md or .csv files for migration</span>
                    </div>
                  </div>
                </label>
              )}
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
