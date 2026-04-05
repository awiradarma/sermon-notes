import { useMemo, useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNotes, fetchUserProfile } from '../../lib/hooks';
import { useAuth } from '../auth/AuthProvider';
import { Filter } from 'lucide-react';

export function GraphView({ onNodeClick }: { onNodeClick?: (noteId: string) => void }) {
  const { notes, loading } = useNotes();
  const { user } = useAuth();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isClient, setIsClient] = useState(false);

  // Filter State
  const [showVerses, setShowVerses] = useState(false);
  const [showTags, setShowTags] = useState(true);
  const [showPreachers, setShowPreachers] = useState(true);
  const [showSeries, setShowSeries] = useState(true);

  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectedPreachers, setSelectedPreachers] = useState<Set<string>>(new Set());
  
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const [knownTags, setKnownTags] = useState<string[]>([]);
  const [knownPreachers, setKnownPreachers] = useState<string[]>([]);

  useEffect(() => {
    setIsClient(true);
    if (user) {
      fetchUserProfile(user.uid).then(p => {
        if (p) {
          setKnownTags(p.knownTags || []);
          setKnownPreachers(p.knownPreachers || []);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];
    const nodeIds = new Set<string>();

    const addNode = (id: string, name: string, group: string, color: string, internalId?: string, isFocused?: boolean) => {
      if (!nodeIds.has(id)) {
        nodes.push({ id, name, group, color, internalId, val: isFocused ? 10 : (group === 'note' ? 4 : 2) });
        nodeIds.add(id);
      }
    };

    const extractBook = (verseStr: string) => {
      if (!verseStr || typeof verseStr !== 'string') return '';
      const match = verseStr.match(/^(\d\s+)?[a-zA-Z\s]+/);
      return match ? match[0].trim() : verseStr.trim();
    };

    let processedNotes = notes;

    if (selectedPreachers.size > 0) {
      processedNotes = processedNotes.filter(n => n.preacher && selectedPreachers.has(n.preacher));
    }
    if (selectedTags.size > 0) {
      processedNotes = processedNotes.filter(n => (n.tags || []).some(t => typeof t === 'string' && selectedTags.has(t.toLowerCase())));
    }

    if (focusedNoteId) {
      const focusNote = notes.find(n => n.docId === focusedNoteId);
      if (focusNote) {
        const connectedPreacher = focusNote.preacher;
        const connectedSeries = focusNote.seriesTitle;
        const connectedTags = new Set((focusNote.tags || []).map(t => typeof t === 'string' ? t.toLowerCase() : ''));
        const connectedVerses = new Set((focusNote.verses || []).map(extractBook));

        processedNotes = processedNotes.filter(n => {
          if (n.docId === focusedNoteId) return true;
          if (connectedPreacher && n.preacher === connectedPreacher && showPreachers) return true;
          if (connectedSeries && n.seriesTitle === connectedSeries && showSeries) return true;
          if (showTags && (n.tags || []).some(t => typeof t === 'string' && connectedTags.has(t.toLowerCase()))) return true;
          if (showVerses && (n.verses || []).some(v => connectedVerses.has(extractBook(v)))) return true;
          return false;
        });
      }
    }

    processedNotes.forEach(note => {
      const noteNodeId = `note_${note.docId}`;
      const isFocused = note.docId === focusedNoteId;
      addNode(noteNodeId, note.title, 'note', isFocused ? '#dc2626' : '#f97316', note.docId, isFocused);

      if (showPreachers && note.preacher) {
        const preacherId = `preacher_${note.preacher}`;
        addNode(preacherId, note.preacher, 'preacher', '#3b82f6');
        links.push({ source: noteNodeId, target: preacherId });
      }

      if (showSeries && note.seriesTitle) {
        const seriesId = `series_${note.seriesTitle}`;
        addNode(seriesId, note.seriesTitle, 'series', '#a855f7');
        links.push({ source: noteNodeId, target: seriesId });
      }

      if (showTags) {
        const uniqueTags = Array.from(new Set((note.tags || []).map(t => typeof t === 'string' ? t.toLowerCase() : ''))).filter(Boolean);
        uniqueTags.forEach(tag => {
          const tagId = `tag_${tag}`;
          addNode(tagId, `#${tag}`, 'tag', '#22c55e');
          links.push({ source: noteNodeId, target: tagId });
        });
      }

      if (showVerses) {
        const uniqueBooks = Array.from(new Set((note.verses || []).map(extractBook))).filter(Boolean);
        uniqueBooks.forEach(book => {
          const verseId = `verse_${book}`;
          addNode(verseId, book, 'verse', '#eab308');
          links.push({ source: noteNodeId, target: verseId });
        });
      }
    });

    return { nodes, links };
  }, [notes, showVerses, showTags, showPreachers, showSeries, selectedTags, selectedPreachers, focusedNoteId]);

  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (fgRef.current && isClient && dimensions.width > 0) {
      // Small timeout to allow physics bounds to establish before zooming
      const timer = setTimeout(() => {
        if (fgRef.current) fgRef.current.zoomToFit(400, 50, () => true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [graphData, isClient, dimensions.width]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const handleNodeClick = (node: any) => {
    if (node.group === 'note' && node.internalId) {
      if (focusedNoteId === node.internalId) {
        if (onNodeClick) onNodeClick(node.internalId);
      } else {
        setFocusedNoteId(node.internalId);
      }
    }
  };

  const drawNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const nodeVal = node.val || 4;
    const radius = Math.sqrt(nodeVal) * 3;
    
    // Draw Node Body
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = node.color;
    ctx.fill();

    // Draw Label if zoomed in reasonably
    if (globalScale > 0.4 || node.val === 10) {
      const label = node.name;
      const fontSize = 12 / globalScale;
      ctx.font = `600 ${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const textY = node.y + radius + (4 / globalScale);

      // Text stroke for readability over links/other nodes
      ctx.lineWidth = 3 / globalScale;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.strokeText(label, node.x, textY);
      
      ctx.fillStyle = '#1e293b';
      ctx.fillText(label, node.x, textY);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-background relative overflow-hidden" ref={containerRef}>
      
      {/* Legend / Header */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none bg-background/80 backdrop-blur p-4 rounded-xl border border-border shadow-sm">
        <h2 className="text-xl font-bold mb-2 text-foreground">Graph Explorer</h2>
        <div className="flex flex-col gap-1 text-xs font-medium">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: '#f97316'}}></span> Notes</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: '#3b82f6'}}></span> Preachers</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: '#a855f7'}}></span> Series</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: '#22c55e'}}></span> Tags</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: '#eab308'}}></span> Verses</div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 italic max-w-[150px]">Click a Note to isolate its connections.</p>
      </div>

      {/* Filter Toggle Button */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm transition-all text-sm font-semibold ${isFilterPanelOpen ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted'}`}
        >
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>
      
      {/* Filter Panel */}
      <div className={`absolute top-16 right-4 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 p-4 rounded-xl border border-border shadow-lg max-h-[70vh] overflow-y-auto w-64 flex flex-col gap-4 transition-all origin-top-right ${isFilterPanelOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-sm text-foreground">Visibility</h3>
          {focusedNoteId && (
            <button onClick={() => setFocusedNoteId(null)} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-1 rounded hover:opacity-80">Clear Focus</button>
          )}
        </div>
        
        <div className="flex flex-col gap-2 border-b border-border pb-4">
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer"><input type="checkbox" className="rounded" checked={showVerses} onChange={e => setShowVerses(e.target.checked)} /> Show Verses</label>
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer"><input type="checkbox" className="rounded" checked={showTags} onChange={e => setShowTags(e.target.checked)} /> Show Tags</label>
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer"><input type="checkbox" className="rounded" checked={showPreachers} onChange={e => setShowPreachers(e.target.checked)} /> Show Preachers</label>
          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer"><input type="checkbox" className="rounded" checked={showSeries} onChange={e => setShowSeries(e.target.checked)} /> Show Series</label>
        </div>

        {knownTags.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Filter by Tag</h4>
            <div className="flex flex-wrap gap-1">
              {Array.from(new Set(knownTags.map(t => t.toLowerCase()))).map(tag => (
                <button 
                  key={tag} 
                  onClick={() => {
                    const newSet = new Set(selectedTags);
                    if (newSet.has(tag)) newSet.delete(tag);
                    else newSet.add(tag);
                    setSelectedTags(newSet);
                  }}
                  className={`text-[10px] px-2 py-1 rounded-full transition-colors font-medium border ${selectedTags.has(tag) ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {knownPreachers.length > 0 && (
          <div className="flex flex-col gap-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Filter by Preacher</h4>
            <div className="flex flex-wrap gap-1">
              {knownPreachers.map(p => (
                <button 
                  key={p} 
                  onClick={() => {
                    const newSet = new Set(selectedPreachers);
                    if (newSet.has(p)) newSet.delete(p);
                    else newSet.add(p);
                    setSelectedPreachers(newSet);
                  }}
                  className={`text-[10px] px-2 py-1 rounded-full transition-colors font-medium border ${selectedPreachers.has(p) ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {focusedNoteId && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-primary/95 backdrop-blur text-primary-foreground px-6 py-3 rounded-full shadow-lg flex justify-between items-center gap-4 animate-in slide-in-from-bottom-8 duration-300 pointer-events-auto">
           <span className="text-sm font-medium line-clamp-1 max-w-[150px] md:max-w-xs">{notes.find(n => n.docId === focusedNoteId)?.title}</span>
           <div className="flex gap-2 items-center">
            <button onClick={() => onNodeClick && onNodeClick(focusedNoteId)} className="bg-background text-foreground px-3 py-1.5 rounded-full text-xs font-bold hover:scale-105 active:scale-95 transition-transform shadow-md">Open Note</button>
            <button onClick={() => setFocusedNoteId(null)} className="hover:opacity-75 transition-opacity ml-1 p-1 bg-primary-foreground/20 rounded-full" title="Clear Focus">&times;</button>
           </div>
        </div>
      )}
      
      {isClient && dimensions.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel={() => ''}
          nodeCanvasObject={drawNode}
          nodeColor="color"
          linkColor={() => 'rgba(150, 150, 150, 0.2)'}
          onNodeClick={handleNodeClick}
          nodeRelSize={4}
          d3VelocityDecay={0.1}
          d3AlphaDecay={0.02}
          cooldownTicks={100}
        />
      )}
    </div>
  );
}
