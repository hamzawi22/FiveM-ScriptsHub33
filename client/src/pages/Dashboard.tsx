import { useAuth } from "@/hooks/use-auth";
import { useScripts, useDeleteScript } from "@/hooks/use-scripts";
import { useScriptStats } from "@/hooks/use-analytics";
import { UploadModal } from "@/components/UploadModal";
import { VirusScanBadge } from "@/components/VirusScanBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Loader2, DollarSign, Download, Eye, Trash2, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: scripts, isLoading } = useScripts();
  const { mutate: deleteScript, isPending: isDeleting } = useDeleteScript();
  
  // Filter for ONLY user's scripts
  const myScripts = scripts?.filter(s => s.userId === user?.id) || [];
  
  // Calculate totals
  const totalViews = myScripts.reduce((acc, s) => acc + s.views, 0);
  const totalDownloads = myScripts.reduce((acc, s) => acc + s.downloads, 0);
  // Mock earnings: $0.10 per download
  const totalEarnings = totalDownloads * 0.10;

  // Mock chart data - in a real app, useScriptStats would aggregate this over time
  const chartData = [
    { name: 'Mon', views: 400, downloads: 240 },
    { name: 'Tue', views: 300, downloads: 139 },
    { name: 'Wed', views: 200, downloads: 980 },
    { name: 'Thu', views: 278, downloads: 390 },
    { name: 'Fri', views: 189, downloads: 480 },
    { name: 'Sat', views: 239, downloads: 380 },
    { name: 'Sun', views: 349, downloads: 430 },
  ];

  if (isLoading) return <div className="flex items-center justify-center h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your scripts and track performance.</p>
        </div>
        <UploadModal />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">${totalEarnings.toFixed(2)}</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +20.1% from last month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Coins Balance</CardTitle>
              <span className="text-xl font-bold text-yellow-500">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display text-yellow-500">500</div>
              <p className="text-xs text-muted-foreground mt-1">
                Earn more by publishing
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{totalViews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {myScripts.length} scripts
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Downloads</CardTitle>
              <Download className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{totalDownloads}</div>
              <p className="text-xs text-green-500 flex items-center mt-1">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +12.5% conversion rate
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scripts Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle>My Scripts</CardTitle>
            </CardHeader>
            <CardContent>
              {myScripts.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  You haven't uploaded any scripts yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead>Script</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Stats</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myScripts.map((script) => (
                      <TableRow key={script.id} className="border-border/50 hover:bg-white/5">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-foreground">{script.title}</span>
                            <span className="text-xs text-muted-foreground">{script.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <VirusScanBadge status={script.virusScanStatus as any} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3"/> {script.views}</span>
                            <span className="flex items-center gap-1"><Download className="w-3 h-3"/> {script.downloads}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this script?')) {
                                deleteScript(script.id);
                              }
                            }}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analytics Chart */}
        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 h-full">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1b26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="downloads" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
