import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { useNotes, fetchUserProfile } from '../../lib/hooks';
import { TipTapEditor } from './TipTapEditor';
import { BIBLE_BOOKS } from '../../lib/bibleBooks';
import { Save, Calendar, User, Book as BookIcon, Hash, FolderOpen, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

export function EditorView({ existingNoteId, onSaved }: { existingNoteId?: string, onSaved?: () => void }) {
  const { user } = useAuth();
  const { addNote, updateNote, removeNote, notes } = useNotes();
  const [knownPreachers, setKnownPreachers] = useState<string[]>([]);
  
  // Note state
  const [title, setTitle] = useState('');
  const [preacher, setPreacher] = useState('');
  const [sermonDate, setSermonDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [versesText, setVersesText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Refs for auto-save (to avoid stale closures on unmount)
  const lastState = useRef({ title, preacher, sermonDate, seriesTitle, isPublic, content, verses: versesText.split(',').map(v => v.trim()).filter(Boolean), tags, existingNoteId });
  
  useEffect(() => {
    lastState.current = { title, preacher, sermonDate, seriesTitle, isPublic, content, verses: versesText.split(',').map(v => v.trim()).filter(Boolean), tags, existingNoteId };
  }, [title, preacher, sermonDate, seriesTitle, isPublic, content, versesText, tags, existingNoteId]);

  // Load existing note or user profile
  useEffect(() => {
    if (user) {
      fetchUserProfile(user.uid).then(profile => {
        if (profile) setKnownPreachers(profile.knownPreachers || []);
      });
    }
  }, [user]);

  useEffect(() => {
    if (existingNoteId && notes.length > 0) {
      const note = notes.find(n => n.docId === existingNoteId);
      if (note) {
        setTitle(note.title);
        setPreacher(note.preacher);
        setSermonDate(note.sermonDate.toISOString().split('T')[0]);
        setSeriesTitle(note.seriesTitle || '');
        setVersesText(note.verses.join(', '));
        setTags(note.tags);
        setContent(note.content);
        setIsPublic(note.isPublic);
      }
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

  // Scroll handler for distraction free
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop > 100 && !isHeaderCollapsed) {
      setIsHeaderCollapsed(true);
    } else if (e.currentTarget.scrollTop === 0 && isHeaderCollapsed) {
      setIsHeaderCollapsed(false);
    }
  };

  // Auto-save on unmount
  useEffect(() => {
    return () => {
      const state = lastState.current;
      // Only auto-save if there's at least a title
      if (!state.title.trim()) return;
      
      const payload = {
        title: state.title,
        preacher: state.preacher,
        sermonDate: new Date(state.sermonDate),
        seriesTitle: state.seriesTitle,
        isPublic: state.isPublic,
        content: state.content,
        verses: state.verses,
        tags: state.tags,
        imageUrls: [] // Required by schema
      };

      if (state.existingNoteId) {
        updateNote(state.existingNoteId, payload).catch(console.error);
      } else {
        addNote(payload).catch(console.error);
      }
    };
  }, [addNote, updateNote]);

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
        sermonDate: new Date(sermonDate),
        seriesTitle,
        verses: versesText.split(',').map(v => v.trim()).filter(Boolean),
        tags,
        content,
        isPublic,
        imageUrls: [] 
      };

      if (existingNoteId) {
        await updateNote(existingNoteId, noteData);
      } else {
        await addNote(noteData);
      }
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto" onScroll={handleScroll} ref={scrollRef}>
      {/* Dynamic Header / Metadata */}
      <div className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden ${isHeaderCollapsed ? 'max-h-0 opacity-0 m-0 p-0' : 'max-h-[500px] opacity-100 p-4 pb-0'}`}>
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
              placeholder="Add tag..." 
              className="bg-transparent text-xs border-none outline-none max-w-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.currentTarget.value.trim().replace(/^#/, '');
                  if (val && !tags.includes(val)) {
                    setTags([...tags, val]);
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
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
      <div className="max-w-3xl w-full mx-auto flex-1 h-full min-h-[60vh] relative z-10 pt-2 pb-20 px-2 lg:px-0">
        <div className="flex justify-end mb-2 pr-2">
          <button 
            type="button"
            onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)} 
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted py-1.5 px-3 rounded-md transition-colors"
          >
            {isHeaderCollapsed ? <><ChevronDown className="w-3.5 h-3.5" /> Show Sermon Details</> : <><ChevronUp className="w-3.5 h-3.5" /> Hide Sermon Details</>}
          </button>
        </div>
        <TipTapEditor content={content} onChange={setContent} />
      </div>
    </div>
  );
}
