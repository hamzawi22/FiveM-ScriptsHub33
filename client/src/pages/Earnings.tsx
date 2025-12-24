import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award, TrendingUp, Users, Eye, Download } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

interface EarningsData {
  coins: number;
  totalEarnings: number;
  followers: number;
  last3MonthsDownloads: number;
  last3MonthsViews: number;
  scriptsCount: number;
  isVerified: boolean;
  verificationEligibility: {
    meetsFollowers: boolean;
    meetsDownloads: boolean;
    meetsViews: boolean;
    canApply: boolean;
  };
  lastVerificationRequest: {
    id: number;
    status: string;
    createdAt: string;
  } | null;
}

export default function Earnings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: earnings, isLoading } = useQuery<EarningsData>({
    queryKey: ["/api/earnings"],
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/verification/request", {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Verification request submitted!" });
      queryClient.invalidateQueries({ queryKey: ["/api/earnings"] });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Failed to submit verification request",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!user) {
      window.location.href = "/";
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!earnings) return null;

  const requirementsMet = earnings.verificationEligibility.canApply;
  const isPending = earnings.lastVerificationRequest?.status === "pending";
  const isApproved = earnings.isVerified;

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-12">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-display font-bold text-white">Earnings & Verification</h1>
        <p className="text-lg text-muted-foreground">Track your revenue and apply for creator verification</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Coins Card */}
        <Card className="p-6 bg-card border-white/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground">Available Coins</h3>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="text-4xl font-bold text-white">{earnings.coins}</div>
            <p className="text-sm text-muted-foreground">Earned from script downloads</p>
          </div>
        </Card>

        {/* Verification Status Card */}
        <Card className="p-6 bg-card border-white/5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-muted-foreground">Verification Status</h3>
              <Award className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-white">
                {isApproved ? "✓ Verified" : isPending ? "Pending..." : "Not Verified"}
              </div>
              {isApproved && <Badge className="bg-green-500/20 text-green-400">Creator</Badge>}
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Followers</span>
            </div>
            <div className="text-2xl font-bold text-white">{earnings.followers}</div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-muted-foreground">Downloads (3m)</span>
            </div>
            <div className="text-2xl font-bold text-white">{earnings.last3MonthsDownloads}</div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-muted-foreground">Views (3m)</span>
            </div>
            <div className="text-2xl font-bold text-white">{earnings.last3MonthsViews}</div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-sm text-muted-foreground">Published</span>
            </div>
            <div className="text-2xl font-bold text-white">{earnings.scriptsCount}</div>
          </div>
        </Card>
      </div>

      {/* Verification Requirements */}
      <Card className="p-8 bg-card border-white/5 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Creator Verification Requirements</h2>
          <p className="text-muted-foreground">Meet all requirements to apply for creator verification status</p>
        </div>

        <div className="space-y-4">
          {/* Followers Requirement */}
          <div className={`p-4 rounded-lg border ${
            earnings.verificationEligibility.meetsFollowers
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-white">500+ Followers</p>
                  <p className="text-sm text-muted-foreground">Required at any time</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{earnings.followers}</p>
                {earnings.verificationEligibility.meetsFollowers && (
                  <span className="text-sm text-green-400">✓ Completed</span>
                )}
              </div>
            </div>
          </div>

          {/* Downloads Requirement */}
          <div className={`p-4 rounded-lg border ${
            earnings.verificationEligibility.meetsDownloads
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-white">5,000+ Downloads (Last 3 months)</p>
                  <p className="text-sm text-muted-foreground">Last 3 calendar months</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{earnings.last3MonthsDownloads}</p>
                {earnings.verificationEligibility.meetsDownloads && (
                  <span className="text-sm text-green-400">✓ Completed</span>
                )}
              </div>
            </div>
          </div>

          {/* Views Requirement */}
          <div className={`p-4 rounded-lg border ${
            earnings.verificationEligibility.meetsViews
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-white">10,000+ Views (Last 3 months)</p>
                  <p className="text-sm text-muted-foreground">Last 3 calendar months</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{earnings.last3MonthsViews}</p>
                {earnings.verificationEligibility.meetsViews && (
                  <span className="text-sm text-green-400">✓ Completed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-white/10">
          {isApproved ? (
            <Button disabled className="w-full h-12 text-lg">
              <Award className="w-5 h-5 mr-2" />
              Verified Creator
            </Button>
          ) : isPending ? (
            <Button disabled className="w-full h-12 text-lg bg-yellow-600">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Verification Pending Review
            </Button>
          ) : (
            <Button
              onClick={() => verifyMutation.mutate()}
              disabled={!requirementsMet || verifyMutation.isPending}
              className={`w-full h-12 text-lg ${
                requirementsMet
                  ? "bg-primary hover:bg-primary/90"
                  : "bg-muted-foreground/20 cursor-not-allowed"
              }`}
            >
              {verifyMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Award className="w-5 h-5 mr-2" />
                  {requirementsMet ? "Apply for Verification" : "Requirements Not Met"}
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
