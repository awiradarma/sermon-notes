import { useMemo, useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNotes } from '../../lib/hooks';

export function GraphView({ onNodeClick }: { onNodeClick?: (noteId: string) => void }) {
  const { notes, loading } = useNotes();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

    const addNode = (id: string, name: string, group: string, color: string, internalId?: string) => {
      if (!nodeIds.has(id)) {
        nodes.push({ id, name, group, color, internalId, val: group === 'note' ? 4 : 2 });
        nodeIds.add(id);
      }
    };

    notes.forEach(note => {
      const noteNodeId = `note_${note.docId}`;
      addNode(noteNodeId, note.title, 'note', '#f97316', note.docId);

      if (note.preacher) {
        const preacherId = `preacher_${note.preacher}`;
        addNode(preacherId, note.preacher, 'preacher', '#3b82f6');
        links.push({ source: noteNodeId, target: preacherId });
      }

      if (note.seriesTitle) {
        const seriesId = `series_${note.seriesTitle}`;
        addNode(seriesId, note.seriesTitle, 'series', '#a855f7');
        links.push({ source: noteNodeId, target: seriesId });
      }

      note.tags.forEach(tag => {
        const tagId = `tag_${tag}`;
        addNode(tagId, `#${tag}`, 'tag', '#22c55e');
        links.push({ source: noteNodeId, target: tagId });
      });

      note.verses.slice(0, 5).forEach(verse => { // limit verses to avoid clutter
        const verseId = `verse_${verse}`;
        addNode(verseId, verse, 'verse', '#eab308');
        links.push({ source: noteNodeId, target: verseId });
      });
    });

    return { nodes, links };
  }, [notes]);

  if (loading) {
    return <div className="flex flex-1 items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const handleNodeClick = (node: any) => {
    if (node.group === 'note' && node.internalId && onNodeClick) {
      onNodeClick(node.internalId);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full w-full bg-background relative" ref={containerRef}>
      <div className="absolute top-4 left-4 z-10 pointer-events-none bg-background/80 backdrop-blur p-4 rounded-xl border border-border shadow-sm">
        <h2 className="text-xl font-bold mb-2 text-foreground">Graph Explorer</h2>
        <div className="flex flex-col gap-1 text-xs font-medium">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: '#f97316'}}></span> Notes</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: '#3b82f6'}}></span> Preachers</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: '#a855f7'}}></span> Series</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: '#22c55e'}}></span> Tags</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{backgroundColor: '#eab308'}}></span> Verses</div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 italic">Click on an orange Note to open it.</p>
      </div>
      
      {isClient && dimensions.width > 0 && (
        <ForceGraph2D
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel="name"
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
