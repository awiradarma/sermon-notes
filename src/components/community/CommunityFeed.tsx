import { useState } from 'react';
import { usePublicNotes } from '../../lib/hooks';
import type { Note } from '../../lib/types';
import { Calendar, User, Heart } from 'lucide-react';
export function CommunityFeed() {
  const { publicNotes, loading, likeNote } = usePublicNotes();
  // Using local state to prevent spamming likes and give immediate UI feedback
  const [likedLocal, setLikedLocal] = useState<Record<string, boolean>>({});

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

  const handleLike = (noteId: string, currentHearts: number) => {
    if (likedLocal[noteId]) return; // disable double liking for now in UI
    setLikedLocal(p => ({ ...p, [noteId]: true }));
    likeNote(noteId, currentHearts).catch(console.error);
  };

  const FeedCard = ({ note }: { note: Note }) => {
    const isLiked = likedLocal[note.docId!];
    return (
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
        <h3 className="font-bold text-lg text-foreground line-clamp-2 leading-tight">{note.title}</h3>
        
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground font-medium border-b border-border pb-3">
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {note.sermonDate.toLocaleDateString()}</span>
          {note.preacher && <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {note.preacher}</span>}
        </div>

        <div 
          className="prose dark:prose-invert prose-sm line-clamp-4 text-muted-foreground my-2" 
          dangerouslySetInnerHTML={{ __html: note.content || '' }} 
        />

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
      <div className="flex flex-col gap-2 mb-8 bg-card p-4 rounded-xl border border-border shadow-sm">
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Community Feed</h2>
        <p className="text-sm text-muted-foreground">Discover sermon notes shared by the community.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {publicNotes.map(n => <FeedCard key={n.docId!} note={n} />)}
      </div>
    </div>
  );
}
