import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef } from "react";
import { useCreateScript } from "@/hooks/use-scripts";
import { Plus, Upload, Loader2, Sparkles, File, Image } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScriptSchema, type InsertScript } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Create a schema that handles coinsRequired as string for input but transforms to number
const formSchema = insertScriptSchema.extend({
  coinsRequired: z.coerce.number().min(0, "Coins must be positive"),
});

export function UploadModal() {
  const [open, setOpen] = useState(false);
  const { mutate: createScript, isPending } = useCreateScript();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedImageName, setSelectedImageName] = useState("");
  const { toast } = useToast();

  const form = useForm<InsertScript>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      coinsRequired: 0,
      duration: "week",
      fileUrl: "",
      fileName: "",
    },
  });

  const onSubmit = (data: InsertScript) => {
    if (!selectedFileName) {
      toast({ title: "Error", description: "Please select a script file", variant: "destructive" });
      return;
    }
    createScript(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        setSelectedFileName("");
        setSelectedImageName("");
      },
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      form.setValue("fileName", file.name);
      form.setValue("fileUrl", URL.createObjectURL(file));
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageName(file.name);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-lg shadow-primary/25 border-0">
          <Plus className="w-4 h-4" />
          Publish Script
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Publish New Script
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-foreground/80">Script Title</Label>
                  <FormControl>
                    <Input placeholder="e.g. Advanced Police Job" {...field} className="bg-background/50 border-white/10 focus:border-primary/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-foreground/80">Description</Label>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe features, dependencies, etc." 
                      className="resize-none h-32 bg-background/50 border-white/10 focus:border-primary/50" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <FormItem>
              <Label className="text-foreground/80">Script File (Must contain fxmanifest.lua)</Label>
              <FormControl>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-dashed border-white/20 bg-background/50"
                  >
                    <File className="w-4 h-4 mr-2" />
                    {selectedFileName || "Choose Script File"}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip,.rar,.tar,.gz"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">Accepted: .zip, .rar, .tar, .gz (Must contain fxmanifest.lua)</p>
                </div>
              </FormControl>
            </FormItem>

            {/* Image Upload */}
            <FormItem>
              <Label className="text-foreground/80">Thumbnail Image (Optional)</Label>
              <FormControl>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => imageInputRef.current?.click()}
                    className="w-full border-dashed border-white/20 bg-background/50"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    {selectedImageName || "Choose Image"}
                  </Button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">Recommended: 400x300px</p>
                </div>
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-foreground/80">Duration (Free for day/week, Premium for month)</Label>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-background/50 border-white/10 focus:border-primary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-white/10">
                        <SelectItem value="day">1 Day (Free)</SelectItem>
                        <SelectItem value="week">1 Week (Free)</SelectItem>
                        <SelectItem value="month">1 Month (Premium Only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="coinsRequired"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-foreground/80">Coins Required to Download (0 = Free)</Label>
                  <FormControl>
                    <Input type="number" min="0" step="1" {...field} className="bg-background/50 border-white/10 focus:border-primary/50" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 h-12 text-lg font-medium"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Publish Now
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Script will be automatically scanned for viruses. Must contain fxmanifest.lua or will be rejected.
              </p>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
