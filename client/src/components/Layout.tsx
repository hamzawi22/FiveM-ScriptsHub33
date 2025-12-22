import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  LayoutDashboard, 
  Home, 
  PlusCircle, 
  ShieldCheck, 
  Menu,
  X 
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const NavLink = ({ href, icon: Icon, children }: { href: string; icon: any; children: React.ReactNode }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer
          ${isActive 
            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-medium" 
            : "text-muted-foreground hover:text-foreground hover:bg-white/5"}
        `}>
          <Icon className="w-4 h-4" />
          {children}
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                  FiveM Hub
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/" icon={Home}>Marketplace</NavLink>
              {user && (
                <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-24 h-9 bg-muted animate-pulse rounded-lg" />
            ) : user ? (
              <>
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-sm text-right">
                    <p className="font-medium text-foreground">{user.firstName || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[150px]">{user.email}</p>
                  </div>
                  {user.profileImageUrl && (
                    <img src={user.profileImageUrl} alt="Avatar" className="w-9 h-9 rounded-full ring-2 ring-border" />
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => logout()}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => window.location.href = "/api/login"}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
              >
                Login with Replit
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 border-l border-border bg-card/95 backdrop-blur-xl">
                <div className="flex flex-col gap-6 mt-8">
                  <nav className="flex flex-col gap-2">
                    <NavLink href="/" icon={Home}>Marketplace</NavLink>
                    {user && (
                      <NavLink href="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                    )}
                  </nav>
                  {user && (
                    <div className="pt-6 border-t border-border">
                       <Button 
                        variant="destructive" 
                        className="w-full justify-start gap-2"
                        onClick={() => logout()}
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-border/40 bg-card/30">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground text-sm">
          <p>© 2024 FiveM Script Hub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
