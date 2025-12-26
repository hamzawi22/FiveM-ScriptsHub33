import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Download, Eye, Heart, Star, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreatorProfile {
  id: string;
  email: string;
  firstName?: string;
  bio?: string;
  followers: number;
  following: number;
  totalEarnings: number;
  coins: number;
  isVerified?: boolean;
  trustScore?: number;
}

export default function Creator() {
  const [, params] = useRoute("/creator/:userId");
  const userId = params?.userId;
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile, isLoading } = useQuery<CreatorProfile>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to follow");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({ title: "Success", description: "Follow status updated" });
    },
  });

  const { data: scripts } = useQuery({
    queryKey: [`/api/users/${userId}/scripts`],
    enabled: !!userId,
  });

  const { data: scriptRatings } = useQuery({
    queryKey: [`/api/scripts/ratings`, scripts],
    enabled: !!scripts && scripts.length > 0,
    queryFn: async () => {
      if (!scripts || scripts.length === 0) return [];
      const ratings = await Promise.all(
        scripts.map(s => fetch(`/api/scripts/${s.id}/ratings`).then(r => r.json()))
      );
      return ratings;
    }
  });

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (!profile) return <div className="text-center py-20 text-destructive">Creator not found</div>;

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="max-w-4xl mx-auto space-y-8" data-testid="page-creator-profile">
      {/* Profile Header */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden" data-testid="card-profile-header">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-blue-600/20" />
        <CardContent className="pt-0">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 mb-6">
            <div className="w-32 h-32 rounded-full bg-primary/20 border-4 border-card flex items-center justify-center">
              <div className="text-4xl font-bold text-primary">{profile.firstName?.slice(0, 1) || profile.email.slice(0, 1).toUpperCase()}</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-display font-bold text-foreground">{profile.firstName || profile.email}</h1>
                {profile.isVerified && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Verified Creator
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">{profile.bio || "No bio added yet"}</p>
              <div className="flex items-center gap-6 mt-4 text-sm flex-wrap">
                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {profile.followers} Followers</span>
                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {profile.following} Following</span>
                <span className="flex items-center gap-2"><Eye className="w-4 h-4" /> {scripts?.length || 0} Scripts</span>
                {profile.trustScore !== undefined && (
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-yellow-500" />
                    {(profile.trustScore || 0).toFixed(1)} Trust Score
                  </span>
                )}
              </div>
            </div>
            {!isOwnProfile && (
              <Button 
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className="gap-2 bg-primary hover:bg-primary/90"
                data-testid="button-follow-creator"
              >
                <Heart className="w-4 h-4" />
                Follow
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">${profile.totalEarnings.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Coins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-yellow-500">{profile.coins}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scripts Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{scripts?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Scripts Grid */}
      {scripts && scripts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-display font-bold">Published Scripts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scripts.map((script) => (
              <Card key={script.id} className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all cursor-pointer">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-foreground">{script.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{script.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {script.views}</span>
                        <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5" /> {script.downloads}</span>
                      </div>
                      <span className={`text-xs font-bold ${script.price > 0 ? 'text-primary' : 'text-green-500'}`}>
                        {script.price > 0 ? `$${script.price}` : 'FREE'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
