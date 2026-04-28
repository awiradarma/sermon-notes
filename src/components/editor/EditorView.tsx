import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useNotes, fetchUserProfile } from '../../lib/hooks';
import { fetchBibleText } from '../../lib/bibleApi';
import { TipTapEditor } from './TipTapEditor';
import { BIBLE_BOOKS } from '../../lib/bibleBooks';
import { Save, Calendar, User, Book as BookIcon, Hash, FolderOpen, ChevronUp, ChevronDown, Trash2, RefreshCw } from 'lucide-react';

export function EditorView({ existingNoteId, onSaved, onNoteCreated }: { existingNoteId?: string, onSaved?: () => void, onNoteCreated?: (id: string) => void }) {
  const { user } = useAuth();
  const { addNote, removeNote, notes, generateNoteId } = useNotes();
  const [loading, setLoading] = useState(!!existingNoteId);
  const [knownPreachers, setKnownPreachers] = useState<string[]>([]);
  const [knownTags, setKnownTags] = useState<string[]>([]);
  
  // Generate deterministic ID on mount
  const [localNoteId] = useState(() => existingNoteId || generateNoteId());
  
  // Note state
  const [title, setTitle] = useState('');
  const [preacher, setPreacher] = useState('');
  const [sermonDate, setSermonDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [seriesTitle, setSeriesTitle] = useState('');
  const [versesText, setVersesText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  const [fetchedVerses, setFetchedVerses] = useState<string | null>(null);
  const [scriptureRefLoaded, setScriptureRefLoaded] = useState('');
  const [isVersesCollapsed, setIsVersesCollapsed] = useState(false);

  // Track changes for auto-save
  useEffect(() => {
    if (loading) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    isDirty.current = true;
  }, [title, preacher, sermonDate, seriesTitle, versesText, tags, content, isPublic, loading]);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isHeaderFocused, setIsHeaderFocused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDirty = useRef(false);
  const isInitialLoad = useRef(true);
  
  // Refs for auto-save (to avoid stale closures on unmount)
  const lastState = useRef({ title, preacher, sermonDate, seriesTitle, isPublic, content, verses: versesText.split(',').map(v => v.trim()).filter(Boolean), tags, localNoteId, fetchedVerses });
  
  useEffect(() => {
    lastState.current = { title, preacher, sermonDate, seriesTitle, isPublic, content, verses: versesText.split(',').map(v => v.trim()).filter(Boolean), tags, localNoteId, fetchedVerses };
  }, [title, preacher, sermonDate, seriesTitle, isPublic, content, versesText, tags, localNoteId, fetchedVerses]);

  // Load existing note or user profile
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.uid).then(profile => {
        if (profile) {
          setKnownPreachers(profile.knownPreachers || []);
          setKnownTags(profile.knownTags || []);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (existingNoteId && notes.length > 0) {
      const note = notes.find(n => n.docId === existingNoteId);
      if (note) {
        setTitle(note.title);
        setPreacher(note.preacher);
        setSermonDate(`${note.sermonDate.getFullYear()}-${String(note.sermonDate.getMonth()+1).padStart(2, '0')}-${String(note.sermonDate.getDate()).padStart(2, '0')}`);
        setSeriesTitle(note.seriesTitle || '');
        setVersesText(note.verses.join(', '));
        setTags(note.tags);
        setContent(note.content);
        setIsPublic(note.isPublic);
        
        // Lock the initial loaded reference so we don't auto-fetch Old notes
        setScriptureRefLoaded(note.verses.join(', '));
        if (note.scriptureContent) {
          setFetchedVerses(note.scriptureContent);
        } else if (note.verses.length > 0) {
          // It had verses but no scripture Content saved. 
          setFetchedVerses(null);
        }
      }
      setLoading(false);
    } else if (!existingNoteId) {
      setLoading(false);
    }
  }, [existingNoteId, notes]);

  // Verse auto-tagging
  useEffect(() => {
    const extractedTags = new Set(tags);
    BIBLE_BOOKS.forEach(book => {
      // Basic regex to see if book name is in the verses text
      const regex = new RegExp(`\\b${book}\\b`, 'i');
      if (regex.test(versesText)) {
        extractedTags.add(book.toLowerCase().replace(/\s+/g, ''));
      }
    });
    if (extractedTags.size > tags.length) {
      setTags(Array.from(extractedTags));
    }
  }, [versesText]);

  // Debounced Verse Fetching for Editor
  const handleManualFetch = async () => {
    const versesArr = versesText.split(',').map(v => v.trim()).filter(Boolean);
    if (versesArr.length === 0) return;
    setFetchedVerses('Loading...');
    const text = await fetchBibleText(versesArr.join('; '));
    setFetchedVerses(text);
    setScriptureRefLoaded(''); // allow future debounces
  };

  useEffect(() => {
    const versesArr = versesText.split(',').map(v => v.trim()).filter(Boolean);
    if (versesArr.length === 0) {
      setFetchedVerses(null);
      return;
    }
    
    // Skip auto-fetch if we just loaded this exact reference from database (preserves old translations)
    if (versesText === scriptureRefLoaded) {
      return;
    }

    const timer = setTimeout(() => {
      fetchBibleText(versesArr.join('; ')).then(text => setFetchedVerses(text));
    }, 1000);
    return () => clearTimeout(timer);
  }, [versesText, scriptureRefLoaded]);

  // Scroll handler for distraction free
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 100 && !isHeaderCollapsed && !isHeaderFocused) {
      setIsHeaderCollapsed(true);
    }
  };

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      const state = lastState.current;
      // Only auto-save if dirty and has a title
      if (!isDirty.current || !state.title.trim()) return;
      
      const payload = {
        title: state.title,
        preacher: state.preacher,
        sermonDate: new Date(Number(state.sermonDate.split('-')[0]), Number(state.sermonDate.split('-')[1]) - 1, Number(state.sermonDate.split('-')[2]), 12, 0, 0),
        seriesTitle: state.seriesTitle,
        isPublic: state.isPublic,
        content: state.content,
        verses: state.verses,
        scriptureContent: state.fetchedVerses || undefined,
        bibleVersion: localStorage.getItem('preferredBibleId') || undefined,
        tags: state.tags,
        imageUrls: [] // Required by schema
      };

      // Always explicitly save using local determinisic ID
      addNote(payload, state.localNoteId).then(ref => {
        if (!existingNoteId && onNoteCreated) onNoteCreated(ref.id);
      }).catch(console.error);
    };
  }, [addNote, existingNoteId, onNoteCreated]);

  const handleDelete = async () => {
    if (!existingNoteId) return;
    if (window.confirm('Are you sure you want to delete this sermon note?')) {
      await removeNote(existingNoteId);
      if (onSaved) onSaved();
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
    setIsSaving(true);
    try {
      const noteData = {
        title,
        preacher,
        sermonDate: new Date(Number(sermonDate.split('-')[0]), Number(sermonDate.split('-')[1]) - 1, Number(sermonDate.split('-')[2]), 12, 0, 0),
        seriesTitle,
        verses: versesText.split(',').map(v => v.trim()).filter(Boolean),
        tags,
        content,
        isPublic,
        scriptureContent: fetchedVerses || undefined,
        bibleVersion: localStorage.getItem('preferredBibleId') || undefined,
        imageUrls: [] 
      };

      if (!existingNoteId) {
        if (onNoteCreated) onNoteCreated(localNoteId);
      }
      
      await addNote(noteData, localNoteId);
      
      if (onSaved) onSaved();
      isDirty.current = false;
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background overflow-y-auto" onScroll={handleScroll} ref={scrollRef}>
      {/* Dynamic Header / Metadata */}
      <div 
        onFocus={() => setIsHeaderFocused(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsHeaderFocused(false);
          }
        }}
        className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${isHeaderCollapsed ? 'max-h-0 opacity-0 m-0 p-0' : 'max-h-[500px] opacity-100 p-4 pb-0'}`}
      >
        <div className="space-y-4 max-w-3xl mx-auto bg-card p-6 rounded-xl border border-border shadow-sm">
          {/* Title Area */}
          <input 
            type="text" 
            placeholder="Sermon Title *" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground focus:ring-0" 
          />
          
          <div className="flex flex-wrap gap-4 text-sm mt-4">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg pr-3 border border-border">
              <div className="p-2 bg-muted rounded-l-lg"><User className="w-4 h-4 text-muted-foreground" /></div>
              <input 
                type="text" 
                list="preachers-list"
                placeholder="Preacher" 
                value={preacher}
                onChange={(e) => setPreacher(e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-0 p-1 text-sm w-32" 
              />
              <datalist id="preachers-list">
                {knownPreachers.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>

            <div className="flex items-center gap-2 bg-muted/50 rounded-lg pr-3 border border-border">
              <div className="p-2 bg-muted rounded-l-lg"><Calendar className="w-4 h-4 text-muted-foreground" /></div>
              <input 
                type="date" 
                value={sermonDate}
                onChange={(e) => setSermonDate(e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-0 p-1 text-sm" 
              />
            </div>
            
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg pr-3 border border-border">
              <div className="p-2 bg-muted rounded-l-lg"><FolderOpen className="w-4 h-4 text-muted-foreground" /></div>
              <input 
                type="text" 
                placeholder="Series" 
                value={seriesTitle}
                onChange={(e) => setSeriesTitle(e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-0 p-1 text-sm w-32" 
              />
            </div>

            <div className="flex items-center gap-2 bg-muted/50 rounded-lg pr-3 flex-1 min-w-[200px] border border-border">
              <div className="p-2 bg-muted rounded-l-lg"><BookIcon className="w-4 h-4 text-muted-foreground" /></div>
              <input 
                type="text"
                list="bible-books-list"
                placeholder="Verses (e.g. John 3:16)" 
                value={versesText}
                onChange={(e) => setVersesText(e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-0 p-1 text-sm w-full" 
              />
              <datalist id="bible-books-list">
                {BIBLE_BOOKS.map(b => <option key={b} value={b} />)}
              </datalist>
              <button 
                type="button"
                className="p-1 hover:bg-muted-foreground/10 rounded transition-colors" 
                title="Fetch Scripture"
                onClick={handleManualFetch}
              >
                <RefreshCw className="w-4 h-4 text-muted-foreground hover:text-primary" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap min-h-[1.5rem]">
            <Hash className="w-4 h-4 text-muted-foreground mr-1" />
            {tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs flex items-center gap-1 group">
                #{tag}
                <button onClick={() => setTags(tags.filter(t => t !== tag))} className="opacity-50 hover:opacity-100 hidden group-hover:block">&times;</button>
              </span>
            ))}
            <input 
              type="text" 
              list="tags-list"
              placeholder="Add tag..." 
              className="bg-transparent text-xs border-none outline-none min-w-[100px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = e.currentTarget.value.trim().replace(/^#/, '');
                  if (val && !tags.includes(val)) {
                    setTags([...tags, val]);
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
            <datalist id="tags-list">
              {knownTags.filter(t => !tags.includes(t)).map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t mt-4">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer font-medium">
              <input 
                type="checkbox" 
                checked={isPublic} 
                onChange={(e) => setIsPublic(e.target.checked)} 
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              Publish to Public Feed
            </label>
            
            <div className="flex items-center gap-3">
              {existingNoteId && (
                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors font-medium text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
              )}
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg shadow-md font-medium hover:scale-[1.03] active:scale-95 transition-transform"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Editor Canvas */}
      <div className="max-w-3xl w-full mx-auto flex-1 min-h-[60vh] relative z-10 pt-2 pb-20 px-2 lg:px-0">
        <div className="flex justify-end mb-2 pr-2">
          <button 
            type="button"
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)} 
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted py-1.5 px-3 rounded-md transition-colors"
          >
            {isHeaderCollapsed ? <><ChevronDown className="w-3.5 h-3.5" /> Show Sermon Details</> : <><ChevronUp className="w-3.5 h-3.5" /> Hide Sermon Details</>}
          </button>
        </div>

        {fetchedVerses && (
          <div className="mb-6 bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2">
            <button 
              onClick={() => setIsVersesCollapsed(!isVersesCollapsed)}
              className="w-full flex items-center justify-between p-3 bg-muted/40 hover:bg-muted text-sm font-semibold transition-colors border-b border-transparent"
            >
              <div className="flex items-center gap-2">
                <BookIcon className="w-4 h-4 text-primary" />
                Scripture Reference (WEB)
              </div>
              {isVersesCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
            </button>
            {!isVersesCollapsed && (
              <div className="p-4 prose dark:prose-invert prose-sm max-w-none text-muted-foreground bg-background/50 border-t border-border max-h-[40vh] overflow-y-auto" dangerouslySetInnerHTML={{ __html: fetchedVerses }} />
            )}
          </div>
        )}

        <TipTapEditor content={content} onChange={setContent} />
      </div>
    </div>
  );
}
