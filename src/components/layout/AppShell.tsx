import { BookOpen, Home, Settings, PenSquare, Users, Network } from "lucide-react"
import { useTheme } from "../theme-provider"
import { SyncIndicator } from "../common/SyncIndicator"

export function AppShell({ 
  children,
  activeTab = "home",
  setActiveTab = () => {} 
}: { 
  children: React.ReactNode, 
  activeTab?: string, 
  setActiveTab?: (tab: string) => void 
}) {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-background text-foreground">
      {/* Top Navbar */}
      <header className="flex h-14 items-center gap-3 border-b bg-card px-4 md:px-6 shrink-0 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2 mr-2 md:mr-6">
          <BookOpen className="w-6 h-6 text-primary shrink-0" />
          <h1 className="font-bold text-lg tracking-tight hidden sm:block">SanctuaryNotes</h1>
          <h1 className="font-bold text-lg tracking-tight sm:hidden">Sanctuary</h1>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center gap-1">
          <button 
            onClick={() => setActiveTab('home')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'home' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Home className="w-4 h-4" /> Library
          </button>
          <button 
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'graph' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Network className="w-4 h-4" /> Graph
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'community' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Users className="w-4 h-4" /> Community
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
          
          <div className="flex-1" />
          
          <button 
            onClick={() => setActiveTab('write')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition-all bg-primary text-primary-foreground hover:bg-primary/90 shadow hover:scale-[1.03] active:scale-95 mr-2`}
          >
            <PenSquare className="w-4 h-4" /> Write
          </button>
        </nav>

        <div className="flex-1 md:hidden" />
        
        <div className="flex items-center gap-2">
          <SyncIndicator />
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors shrink-0"
            title="Toggle Theme"
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
      </header>
      
      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-0 bg-muted/20 pb-20 md:pb-6 relative w-full ${activeTab === 'graph' ? '' : 'max-w-5xl mx-auto md:mt-4 md:px-4'}`}>
        {children}
      </main>

      {/* Bottom Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="flex justify-around items-center h-16 pb-safe">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 p-2 flex-1 ${activeTab === 'home' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Library</span>
          </button>

          <button 
            onClick={() => setActiveTab('community')}
            className={`flex flex-col items-center gap-1 p-2 flex-1 ${activeTab === 'community' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Community</span>
          </button>

          <button 
            onClick={() => setActiveTab('graph')}
            className={`flex flex-col items-center gap-1 p-2 flex-1 ${activeTab === 'graph' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Network className="w-5 h-5" />
            <span className="text-[10px] font-medium">Graph</span>
          </button>
          
          <div className="flex-1 flex justify-center">
            <button 
              onClick={() => setActiveTab('write')}
              className={`flex flex-col flex-none items-center justify-center p-3 rounded-full bg-primary text-primary-foreground -mt-6 shadow-lg shadow-primary/30 hover:bg-primary/90 hover:scale-105 transition-transform active:scale-95`}
            >
              <PenSquare className="w-6 h-6" />
            </button>
          </div>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 p-2 flex-1 ${activeTab === 'settings' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>
      
      {/* Desktop Sidebar (Optional, visually padding bottom on mobile) */}
    </div>
  )
}
