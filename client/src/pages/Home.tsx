import { useScripts } from "@/hooks/use-scripts";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { UploadModal } from "@/components/UploadModal";
import { VirusScanBadge } from "@/components/VirusScanBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Download, Eye, ChevronRight, Terminal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Home() {
  const { data: scripts, isLoading } = useScripts();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const filteredScripts = scripts?.filter(script => 
    script.title.toLowerCase().includes(search.toLowerCase()) ||
    script.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-card border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 px-8 py-16 md:px-12 md:py-20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              <Terminal className="w-4 h-4" />
              <span>The #1 Marketplace for FiveM Scripts</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight text-white text-glow">
              Elevate Your Server <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                With Premium Scripts
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Discover verified, safe, and high-quality resources for your community. 
              Join thousands of server owners today.
            </p>
            <div className="flex items-center gap-4 pt-2">
              {user ? (
                <UploadModal />
              ) : (
                <Button 
                  onClick={() => window.location.href = "/api/login"} 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-xl h-12 px-8"
                >
                  Get Started
                </Button>
              )}
              <Button variant="outline" size="lg" className="rounded-xl h-12 border-white/10 hover:bg-white/5">
                Browse Collection
              </Button>
            </div>
          </div>
          
          {/* Decorative Graphic */}
          <div className="hidden md:block relative w-64 h-64 md:w-96 md:h-96">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-cyan-400 opacity-20 blur-3xl rounded-full" />
            <div className="relative z-10 grid grid-cols-2 gap-4 rotate-[-12deg] opacity-80">
               {[1, 2, 3, 4].map((i) => (
                 <div key={i} className="h-32 bg-card border border-white/10 rounded-2xl shadow-xl p-4 flex flex-col justify-between backdrop-blur-sm">
                   <div className="w-8 h-8 rounded-lg bg-primary/20" />
                   <div className="space-y-2">
                     <div className="h-2 w-20 bg-white/10 rounded" />
                     <div className="h-2 w-12 bg-white/10 rounded" />
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-40 bg-background/80 backdrop-blur-xl p-4 -mx-4 md:mx-0 rounded-xl border border-white/5 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search scripts..." 
            className="pl-10 bg-card border-border/50 focus:ring-primary/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Button variant="outline" size="sm" className="bg-card border-border/50 text-muted-foreground whitespace-nowrap">
            <Filter className="w-4 h-4 mr-2" />
            All Categories
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground whitespace-nowrap">Free</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground whitespace-nowrap">Paid</Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground whitespace-nowrap">Verified Only</Button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[300px] rounded-2xl bg-card border border-border/50 animate-pulse" />
          ))}
        </div>
      ) : filteredScripts?.length === 0 ? (
        <div className="text-center py-20 bg-card/50 rounded-2xl border border-dashed border-border">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground">No scripts found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScripts?.map((script, idx) => (
            <motion.div 
              key={script.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <Link href={`/script/${script.id}`}>
                <div className="group h-full bg-card hover:bg-card/80 border border-border/50 hover:border-primary/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer flex flex-col">
                  {/* Thumbnail Placeholder */}
                  <div className="h-40 bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-white/5" />
                    <div className="absolute top-4 right-4">
                      <VirusScanBadge status={script.virusScanStatus as any} />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                       <div className="flex items-center gap-2 text-xs text-white/80">
                         <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold">
                           {script.userId.slice(0, 2).toUpperCase()}
                         </div>
                         <span>By Developer</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <h3 className="font-display font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {script.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${script.price > 0 ? 'bg-primary/20 text-primary' : 'bg-green-500/20 text-green-500'}`}>
                        {script.price > 0 ? `$${script.price}` : 'FREE'}
                      </span>
                    </div>
                    
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-1">
                      {script.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {script.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" />
                          {script.downloads}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                        View Details <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
