import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, Heart } from "lucide-react";

interface ProfileResult {
  id: string;
  firstName: string;
  email: string;
  followers: number;
  scriptsCount: number;
  isVerified: boolean;
  trustScore: number;
}

export default function SearchProfiles() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12">
      {/* Search Section */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold text-white">Search Creators</h1>
          <p className="text-lg text-muted-foreground">Find and follow talented script creators</p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10 h-12 bg-card border-white/10"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            className="bg-primary hover:bg-primary/90 h-12 px-6"
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
      </section>

      {/* Results Section */}
      {isSearching ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 bg-card border-white/5">
              <Skeleton className="h-12 w-12 rounded-full mb-4" />
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4">
          {results.map((profile) => (
            <Card
              key={profile.id}
              className="p-6 bg-card border-white/5 hover:border-primary/30 cursor-pointer transition-all"
              onClick={() => window.location.href = `/creator/${profile.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">{profile.firstName}</h3>
                    {profile.isVerified && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <p className="text-muted-foreground text-sm">{profile.email}</p>

                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{profile.followers}</span>
                      <span className="text-xs text-muted-foreground">Followers</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-muted-foreground">{profile.scriptsCount}</span>
                      <span className="text-xs text-muted-foreground">Scripts</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Trust:</span>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < Math.min(5, Math.floor(profile.trustScore / 20))
                                ? "text-yellow-400"
                                : "text-muted-foreground/30"
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="border-primary/50 text-primary hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/creator/${profile.id}`;
                  }}
                >
                  View Profile
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : search && !isSearching ? (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No creators found matching "{search}"</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Search for creators by name to get started</p>
        </div>
      )}
    </div>
  );
}
