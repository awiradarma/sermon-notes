import { useState, useMemo } from 'react';
import { useNotes } from '../../lib/hooks';
import type { Note } from '../../lib/types';
import { Calendar, User, FolderOpen, Globe, Lock, CheckSquare, Square, Trash2, CheckCircle2 } from 'lucide-react';

export function LibraryView({ onEditNote }: { onEditNote: (noteId: string) => void }) {
  const { notes, loading, removeNote } = useNotes();
  const [filter, setFilter] = useState('');
  const [groupBy, setGroupBy] = useState<'none' | 'series' | 'preacher'>('none');
  
  // Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredNotes = notes.filter(n => {
    if (!filter) return true;
    const term = filter.toLowerCase();
    return n.title.toLowerCase().includes(term) || 
           n.preacher.toLowerCase().includes(term) || 
           n.tags.some(t => t.toLowerCase().includes(term)) ||
           (n.seriesTitle && n.seriesTitle.toLowerCase().includes(term));
  });

  const groupedNotes = useMemo(() => {
    if (groupBy === 'none') {
      return [{ groupTitle: 'All Notes', items: filteredNotes }];
    } else if (groupBy === 'series') {
      const map = new Map<string, Note[]>();
      filteredNotes.forEach(n => {
        const g = n.seriesTitle || 'No Series';
        if (!map.has(g)) map.set(g, []);
        map.get(g)!.push(n);
      });
      return Array.from(map.entries()).map(([groupTitle, items]) => ({ groupTitle, items }));
    } else {
      const map = new Map<string, Note[]>();
      filteredNotes.forEach(n => {
        const g = n.preacher || 'Unknown Preacher';
        if (!map.has(g)) map.set(g, []);
        map.get(g)!.push(n);
      });
      return Array.from(map.entries()).map(([groupTitle, items]) => ({ groupTitle, items }));
    }
  }, [groupBy, filteredNotes]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotes.map(n => n.docId!)));
    }
  };

  const toggleSelectNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} sermon notes?`)) {
      for (const id of selectedIds) {
        await removeNote(id);
      }
      setSelectedIds(new Set());
      setIsSelectionMode(false);
      alert('Deletion complete!');
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-card rounded-xl mx-4 mt-8 outline outline-1 outline-border">
        <h2 className="text-2xl font-bold text-foreground mb-2">No Notes Yet</h2>
        <p className="text-muted-foreground max-w-md">Your library is empty. Tap the pen icon below to start writing your first sermon note.</p>
      </div>
    );
  }

  const NoteCard = ({ note }: { note: Note }) => {
    const isSelected = selectedIds.has(note.docId!);
    
    return (
      <div 
        onClick={() => isSelectionMode ? toggleSelectNote({ stopPropagation: () => {} } as any, note.docId!) : onEditNote(note.docId!)}
        className={`bg-card border rounded-xl p-5 shadow-sm transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden ${isSelected ? 'border-primary ring-1 ring-primary' : 'border-border hover:shadow-md hover:border-primary/50'}`}
      >
        {isSelectionMode && (
          <div className="absolute top-2 right-2 z-10">
            {isSelected ? (
              <CheckCircle2 className="w-5 h-5 text-primary fill-primary-foreground" />
            ) : (
              <Square className="w-5 h-5 text-muted-foreground opacity-50" />
            )}
          </div>
        )}
        
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-lg text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors pr-6">{note.title}</h3>
          {!isSelectionMode && (note.isPublic ? <Globe className="w-4 h-4 text-primary shrink-0" /> : <Lock className="w-4 h-4 text-muted-foreground shrink-0" />)}
        </div>
        
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground font-medium">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {note.sermonDate.toLocaleDateString()}</span>
          {note.preacher && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {note.preacher}</span>}
          {note.seriesTitle && <span className="flex items-center gap-1.5"><FolderOpen className="w-3.5 h-3.5" /> {note.seriesTitle}</span>}
        </div>

        {(note.verses.length > 0 || note.tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {note.verses.slice(0, 3).map(v => <span key={v} className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-[10px] uppercase font-bold tracking-wider">{v}</span>)}
            {note.tags.map(t => <span key={t} className="px-2 py-0.5 text-primary bg-primary/5 rounded-full text-[10px] font-semibold">#{t}</span>)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-background p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col w-full">
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Library</h2>
          <p className="text-sm text-muted-foreground">{filteredNotes.length} sermons</p>
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
              <option value="none">Timeline</option>
              <option value="series">By Series</option>
              <option value="preacher">By Preacher</option>
            </select>
            <button 
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectedIds(new Set());
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${isSelectionMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {isSelectionMode ? 'Cancel' : 'Select'}
            </button>
          </div>
        </div>
      </div>

      {isSelectionMode && (
        <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-4 rounded-xl mb-6 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-semibold text-primary"
            >
              {selectedIds.size === filteredNotes.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selectedIds.size === filteredNotes.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm font-medium text-muted-foreground">{selectedIds.size} selected</span>
          </div>
          <button 
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-destructive/90 disabled:opacity-50 disabled:grayscale transition-all"
          >
            <Trash2 className="w-4 h-4" /> Delete Selected
          </button>
        </div>
      )}

      <div className="flex flex-col gap-8 pb-20">
        {groupedNotes.map(group => (
          <div key={group.groupTitle} className="flex flex-col gap-4">
            {groupBy !== 'none' && (
              <h3 className="text-xl font-bold border-b border-border pb-2 text-foreground/80">{group.groupTitle}</h3>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {group.items.map(n => <NoteCard key={n.docId!} note={n} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
