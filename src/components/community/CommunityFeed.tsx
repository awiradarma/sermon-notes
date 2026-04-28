import { useState, useEffect, useMemo } from 'react';
import { usePublicNotes } from '../../lib/hooks';
import { fetchBibleText } from '../../lib/bibleApi';
import type { Note } from '../../lib/types';
import { Calendar, User, Heart, X, ChevronDown, ChevronUp } from 'lucide-react';
import { getGroupTheme } from '../../lib/theme';

export function CommunityFeed() {
  const { publicNotes, loading, likeNote } = usePublicNotes();
  const [likedLocal, setLikedLocal] = useState<Record<string, boolean>>({});
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  const [filter, setFilter] = useState('');
  const [groupBy, setGroupBy] = useState<'month' | 'series' | 'preacher'>('month');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const [fetchedVerses, setFetchedVerses] = useState<string | null>(null);
  const [isVersesCollapsed, setIsVersesCollapsed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingNote(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (viewingNote && viewingNote.verses.length > 0) {
      const query = viewingNote.verses.join('; ');
      fetchBibleText(query).then((text: any) => setFetchedVerses(text));
    } else {
      setFetchedVerses(null);
    }
  }, [viewingNote]);

  const filteredNotes = useMemo(() => {
    return publicNotes.filter(n => {
      if (!filter) return true;
      const term = filter.toLowerCase();
      return n.title.toLowerCase().includes(term) || 
             (n.preacher && n.preacher.toLowerCase().includes(term)) || 
             (n.tags || []).some(t => t.toLowerCase().includes(term)) ||
             (n.seriesTitle && n.seriesTitle.toLowerCase().includes(term));
    });
  }, [publicNotes, filter]);

  const groupedNotes = useMemo(() => {
    const map = new Map<string, Note[]>();
    filteredNotes.forEach(n => {
      let g = 'Uncategorized';
      if (groupBy === 'month') {
        const d = n.sermonDate;
        g = d.toLocaleString('default', { month: 'long', year: 'numeric' });
      } else if (groupBy === 'series') {
        g = n.seriesTitle || 'Uncategorized';
      } else if (groupBy === 'preacher') {
        g = n.preacher || 'Uncategorized';
      }
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(n);
    });
    
    return Array.from(map.entries())
      .map(([groupTitle, items]) => ({ groupTitle, items }))
      .sort((a, b) => {
        if (groupBy === 'month') {
           return b.items[0].sermonDate.getTime() - a.items[0].sermonDate.getTime();
        }
        return a.groupTitle.localeCompare(b.groupTitle);
      });
  }, [groupBy, filteredNotes]);

  const toggleGroup = (groupTitle: string) => {
    const newSet = new Set(collapsedGroups);
    if (newSet.has(groupTitle)) newSet.delete(groupTitle);
    else newSet.add(groupTitle);
    setCollapsedGroups(newSet);
  };

  const handleLike = (noteId: string, currentHearts: number) => {
    if (likedLocal[noteId]) return; // disable double liking for now in UI
    setLikedLocal(p => ({ ...p, [noteId]: true }));
    likeNote(noteId, currentHearts).catch(console.error);
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (publicNotes.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-card rounded-xl mx-4 mt-8 outline outline-1 outline-border">
        <h2 className="text-2xl font-bold text-foreground mb-2">Quiet in the Sanctuary</h2>
        <p className="text-muted-foreground max-w-md">No public notes have been shared yet. Be the first to share one!</p>
      </div>
    );
  }

  const FeedCard = ({ note }: { note: Note }) => {
    const isLiked = likedLocal[note.docId!];
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
        <h3 className="font-bold text-lg text-foreground line-clamp-2 leading-tight">{note.title}</h3>
        
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground font-medium border-b border-border pb-3">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {note.sermonDate.toLocaleDateString('default')}</span>
          {note.preacher && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {note.preacher}</span>}
        </div>

        <div 
          onClick={() => setViewingNote(note)}
          className="cursor-pointer group flex flex-col gap-2"
        >
          <div 
            className="prose dark:prose-invert prose-sm line-clamp-4 text-muted-foreground my-2 group-hover:text-foreground transition-colors" 
            dangerouslySetInnerHTML={{ __html: note.content || '' }} 
          />
          <p className="text-primary text-xs font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Read Full Note &rarr;</p>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
          <div className="flex flex-wrap gap-1.5">
            {note.verses.slice(0, 2).map(v => <span key={v} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px] uppercase font-bold tracking-wider">{v}</span>)}
            {note.tags.slice(0, 2).map(t => <span key={t} className="px-2 py-0.5 text-primary bg-primary/5 rounded-full text-[10px] font-semibold">#{t}</span>)}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleLike(note.docId!, note.heartCount)}
              disabled={isLiked}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full transition-colors ${
                isLiked ? 'text-destructive bg-destructive/10 cursor-not-allowed' : 'text-muted-foreground hover:text-destructive hover:bg-muted cursor-pointer'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} /> 
              {note.heartCount + (isLiked ? 1 : 0)}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-background p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col w-full">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Community Feed</h2>
          <p className="text-sm text-muted-foreground">{filteredNotes.length} public sermons</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search notes, tags..." 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto sm:flex-1 rounded-lg border border-input bg-background/50 px-4 py-2 text-sm max-w-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-inner"
          />
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="flex-1 sm:flex-none rounded-lg border border-input bg-background/50 px-3 py-2 text-sm focus:ring-primary focus:border-primary outline-none"
            >
              <option value="month">By Month</option>
              <option value="series">By Series</option>
              <option value="preacher">By Preacher</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-8 pb-20">
        {groupedNotes.map(group => {
          const isCollapsed = collapsedGroups.has(group.groupTitle);
          const themeClass = getGroupTheme(group.groupTitle);
          
          return (
            <div key={group.groupTitle} className={`flex flex-col gap-4 rounded-[1.5rem] p-5 transition-colors border shadow-sm ${themeClass}`}>
              <button 
                onClick={() => toggleGroup(group.groupTitle)}
                className="flex items-center justify-between text-left group transition-all"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-extrabold text-foreground/90 tracking-tight">{group.groupTitle}</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-black/5 text-black/60 rounded-full">{group.items.length}</span>
                </div>
                <div className="p-1.5 bg-black/5 rounded-full text-black/40 group-hover:bg-black/10 transition-colors">
                  {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </div>
              </button>
              
              {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                  {group.items.map(n => <FeedCard key={n.docId!} note={n} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {viewingNote && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-lg line-clamp-1">{viewingNote.title}</h3>
              <button 
                onClick={() => setViewingNote(null)}
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-foreground font-medium border-b border-border pb-4 mb-4">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {viewingNote.sermonDate.toLocaleDateString('default')}</span>
                {viewingNote.preacher && <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {viewingNote.preacher}</span>}
              </div>
              
              {fetchedVerses && (
                <div className="mb-6 bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in">
                  <button 
                    onClick={() => setIsVersesCollapsed(!isVersesCollapsed)}
                    className="w-full flex items-center justify-between p-3 bg-muted/40 hover:bg-muted text-sm font-semibold transition-colors border-b border-transparent"
                  >
                    <div className="flex items-center gap-2">
                      Scripture Reference (WEB)
                    </div>
                    {isVersesCollapsed ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {!isVersesCollapsed && (
                    <div className="p-4 prose dark:prose-invert prose-sm max-w-none text-muted-foreground bg-background/50 border-t border-border max-h-64 overflow-y-auto" dangerouslySetInnerHTML={{ __html: fetchedVerses }} />
                  )}
                </div>
              )}

              <div 
                className="prose dark:prose-invert prose-blue max-w-none" 
                dangerouslySetInnerHTML={{ __html: viewingNote.content || '' }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
