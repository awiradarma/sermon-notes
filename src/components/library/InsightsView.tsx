import { useMemo } from 'react';
import { useNotes } from '../../lib/hooks';
import { BarChart3, LineChart, BookMarked, User as UserIcon, CalendarDays, Flame } from 'lucide-react';

export function InsightsView() {
  const { notes, loading } = useNotes();

  const stats = useMemo(() => {
    if (!notes.length) return null;

    let totalWords = 0;
    const preacherCount: Record<string, number> = {};
    const tagCount: Record<string, number> = {};
    let currentStreak = 0;
    
    // Simplistic streak calc based on weeks (Sunday to Sunday)
    const sortedDates = [...notes].map(n => n.sermonDate.getTime()).sort((a,b) => b-a);
    let lastWeek = -1;
    for (let current of sortedDates) {
      // rough week calculation
      const week = Math.floor(current / (1000 * 60 * 60 * 24 * 7));
      if (lastWeek === -1) {
        currentStreak = 1;
        lastWeek = week;
      } else if (lastWeek - week === 1) {
        currentStreak++;
        lastWeek = week;
      } else if (lastWeek - week > 1) {
        break; // streak broke
      }
    }

    notes.forEach(n => {
      // Rough words estimate
      const words = n.content ? n.content.split(/\s+/).length : 0;
      totalWords += words;

      // Preachers
      if (n.preacher) {
        preacherCount[n.preacher] = (preacherCount[n.preacher] || 0) + 1;
      }

      // Tags & Books
      n.tags.forEach(t => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
      // A quick heuristic for books: tags that match known books. Here we just take top tags as books
    });

    const topPreachers = Object.entries(preacherCount).sort((a,b) => b[1]-a[1]).slice(0, 3);
    const topTags = Object.entries(tagCount).sort((a,b) => b[1]-a[1]).slice(0, 5);

    return {
      totalNotes: notes.length,
      totalWords,
      currentStreak,
      topPreachers,
      topTags
    };
  }, [notes]);

  if (loading) {
    return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!stats) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-card rounded-xl mx-4 mt-8 outline outline-1 outline-border">
        <h2 className="text-2xl font-bold text-foreground mb-2">No Insights Yet</h2>
        <p className="text-muted-foreground max-w-md">Start writing notes to see your personalized sermon insights and statistics here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-background p-4 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
          <LineChart className="w-8 h-8 text-primary" /> Analytics & Insights
        </h2>
        <p className="text-muted-foreground">Detailed statistics from your sermon note-taking journey.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BookMarked className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.totalNotes}</p>
          <p className="text-sm font-medium text-muted-foreground">Total Sermons</p>
        </div>
        
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.totalWords.toLocaleString()}</p>
          <p className="text-sm font-medium text-muted-foreground">Words Written</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{stats.currentStreak}</p>
          <p className="text-sm font-medium text-muted-foreground">Week Streak</p>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
            <CalendarDays className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{Math.round(stats.totalNotes / (Math.max(1, stats.currentStreak || 1)))}</p>
          <p className="text-sm font-medium text-muted-foreground">Avg per Week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
            <UserIcon className="w-5 h-5 text-primary" /> Preacher Frequency
          </h3>
          <div className="space-y-4">
            {stats.topPreachers.length > 0 ? stats.topPreachers.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-4">
                <span className="w-6 text-center font-bold text-muted-foreground text-sm">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-foreground">{name}</span>
                    <span className="text-muted-foreground">{count} sermons</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / stats.totalNotes) * 100}%` }} />
                  </div>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No preachers recorded.</p>}
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
            <BookMarked className="w-5 h-5 text-primary" /> Common Tags & Books
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.length > 0 ? stats.topTags.map(([tag, count]) => (
              <div key={tag} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 text-primary rounded-lg border border-primary/10">
                <span className="font-bold">#{tag}</span>
                <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-md font-semibold">{count}</span>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center w-full py-4">No tags created.</p>}
          </div>
          
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3">Tag Cloud Preview</h4>
            <div className="flex flex-wrap gap-3 items-center justify-center py-4">
              {stats.topTags.map(([tag, _], index) => {
                const sizes = ['text-2xl font-black text-primary', 'text-xl font-extrabold text-foreground', 'text-lg font-bold text-foreground/80', 'text-base font-semibold text-foreground/60', 'text-sm font-medium text-foreground/40'];
                return (
                  <span key={tag} className={sizes[Math.min(index, sizes.length - 1)] + " transition-transform hover:scale-110 cursor-default"}>
                    {tag}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
