import { useScript, useScanScript } from "@/hooks/use-scripts";
import { useTrackAnalytics } from "@/hooks/use-analytics";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { VirusScanBadge } from "@/components/VirusScanBadge";
import { Loader2, Download, Eye, Calendar, Shield, Share2, AlertTriangle, FileText, Star, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function ScriptDetail() {
  const [, params] = useRoute("/script/:id");
  const id = parseInt(params?.id || "0");
  const { data: script, isLoading, error } = useScript(id);
  const { mutate: scanScript, isPending: isScanning } = useScanScript();
  const { mutate: trackAnalytics } = useTrackAnalytics();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  const rateMutation = useMutation({
    mutationFn: async (rating: number) => {
      return await apiRequest("POST", `/api/scripts/${id}/rate`, { rating });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Rating submitted!" });
      queryClient.invalidateQueries({ queryKey: [`/api/scripts/${id}`] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit rating", variant: "destructive" });
    }
  });

  const reportMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/scripts/${id}/report`, { 
        reason: reportReason, 
        description: reportDescription 
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Report submitted!" });
      setShowReportDialog(false);
      setReportReason("");
      setReportDescription("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit report", variant: "destructive" });
    }
  });

  if (isLoading) return <DetailSkeleton />;
  if (error || !script) return <div className="text-center py-20 text-destructive">Failed to load script</div>;

  const isOwnProfile = user?.id === script.userId;

  const handleDownload = () => {
    trackAnalytics({ scriptId: script.id, type: "download", country: "US" }); // Mock country
    toast({
      title: "Download Started",
      description: `Downloading ${script.fileName}...`,
    });
    // Simulate download by opening URL
    // window.open(script.fileUrl, '_blank');
  };

  const handleScan = () => {
    scanScript(script.id, {
      onSuccess: () => {
        toast({ title: "Scan Complete", description: "The script has been re-scanned." });
      }
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/script/${script.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied", description: "Script link copied to clipboard!" });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Card */}
      <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
        <div className="h-48 md:h-64 bg-gradient-to-r from-gray-900 to-gray-800 relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          
          <div className="absolute bottom-6 left-6 md:left-10 right-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                 <VirusScanBadge status={script.virusScanStatus as any} report={script.virusScanReport} />
                 <span className="bg-primary/20 text-primary px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                    v1.0.0
                 </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-2 text-glow">
                {script.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4"/> {script.views} Views</span>
                <span className="flex items-center gap-1.5"><Download className="w-4 h-4"/> {script.downloads} Downloads</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4"/> {new Date(script.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-xl border-white/10 hover:bg-white/5"
                onClick={handleShare}
                data-testid="button-share-script"
              >
                <Share2 className="w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                onClick={handleDownload}
                className="rounded-xl px-8 h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 font-bold text-lg gap-2"
              >
                <Download className="w-5 h-5" />
                Download {script.coinsRequired > 0 ? `${script.coinsRequired}💰` : 'Free'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card/50 border border-border/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
            <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Description
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
              {script.description}
            </div>
          </div>

          {/* Virus Report Detail (if exists) */}
          {script.virusScanStatus !== 'pending' && (
             <div className="bg-card/50 border border-border/50 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
              <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Security Analysis
              </h2>
              <div className={`p-4 rounded-xl border ${script.virusScanStatus === 'clean' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="flex items-start gap-3">
                  {script.virusScanStatus === 'clean' ? (
                    <Shield className="w-5 h-5 text-green-500 mt-1" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-1" />
                  )}
                  <div>
                    <h4 className={`font-bold ${script.virusScanStatus === 'clean' ? 'text-green-500' : 'text-red-500'}`}>
                      {script.virusScanStatus === 'clean' ? 'No Threats Detected' : 'Potential Security Risk'}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {script.virusScanReport || "Automated analysis completed successfully. No malicious patterns found in the source code."}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Manual Rescan Button (Admin/Owner feature normally, but adding here for demo) */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleScan} 
                disabled={isScanning}
                className="mt-4 text-xs text-muted-foreground hover:text-foreground"
              >
                {isScanning ? <Loader2 className="w-3 h-3 mr-2 animate-spin"/> : <Shield className="w-3 h-3 mr-2" />}
                Run Manual Scan
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator Profile */}
          {/* Rating Section */}
          {user && (
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg mb-4">Rate This Script</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      data-testid={`button-rate-${star}`}
                      onClick={() => rateMutation.mutate(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      disabled={rateMutation.isPending}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= (hoverRating || userRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {userRating ? `You rated ${userRating} stars` : "Click to rate"}
                </p>
              </div>
            </div>
          )}

          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h3 className="font-display font-bold text-lg mb-4">Creator</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                  {script.userId.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Developer ID</p>
                  <p className="text-xs text-muted-foreground">{script.userId.slice(0, 8)}</p>
                </div>
              </div>
              {!isOwnProfile && (
                <Button 
                  className="w-full gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => window.location.href = `/creator/${script.userId}`}
                  data-testid="button-follow-from-script"
                >
                  <span>Follow Creator</span>
                </Button>
              )}
              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5" onClick={() => window.location.href = `/creator/${script.userId}`}>
                View Profile
              </Button>
            </div>
          </div>

          {/* Report Section */}
          {user && (
            <>
              <Button
                variant="destructive"
                className="w-full gap-2"
                onClick={() => setShowReportDialog(true)}
                data-testid="button-report-script"
              >
                <Flag className="w-4 h-4" />
                Report Script
              </Button>

              <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Script</DialogTitle>
                    <DialogDescription>
                      Help us keep the marketplace safe by reporting problematic scripts.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Reason *</label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                      >
                        <option value="">Select reason...</option>
                        <option value="malware">Malware/Virus</option>
                        <option value="spam">Spam</option>
                        <option value="stolen">Stolen Code</option>
                        <option value="broken">Broken/Non-functional</option>
                        <option value="copyright">Copyright Violation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Details</label>
                      <Textarea
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Describe the issue..."
                        className="text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowReportDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => reportMutation.mutate()}
                        disabled={!reportReason || reportMutation.isPending}
                      >
                        {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}

          <div className="bg-card border border-border/50 rounded-2xl p-6">
            <h3 className="font-display font-bold text-lg mb-4">File Information</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Filename</span>
                <span className="font-mono text-foreground">{script.fileName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-mono text-foreground capitalize">{script.duration}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Expires</span>
                <span className="font-mono text-foreground">{script.expiresAt ? new Date(script.expiresAt).toLocaleDateString() : 'Permanent'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-mono text-foreground">{new Date(script.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-2xl p-6 border border-primary/20">
            <h3 className="font-display font-bold text-lg mb-2 text-white">Need Support?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Contact the developer for installation help or bug reports.
            </p>
            <Button variant="outline" className="w-full bg-background/50 border-white/10 hover:bg-background hover:text-primary">
              Contact Developer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
