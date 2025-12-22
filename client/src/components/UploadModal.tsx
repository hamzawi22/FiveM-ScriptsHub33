import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useCreateScript } from "@/hooks/use-scripts";
import { Plus, Upload, Loader2, Sparkles } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScriptSchema, type InsertScript } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { z } from "zod";

// Create a schema that handles price as string for input but transforms to number
const formSchema = insertScriptSchema.extend({
  price: z.coerce.number().min(0, "Price must be positive"),
});

export function UploadModal() {
  const [open, setOpen] = useState(false);
  const { mutate: createScript, isPending } = useCreateScript();

  const form = useForm<InsertScript>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      fileUrl: "", // In a real app, this would come from a file upload handler
      fileName: "",
    },
  });

  const onSubmit = (data: InsertScript) => {
    createScript(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-lg shadow-primary/25 border-0">
          <Plus className="w-4 h-4" />
          Publish Script
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-white/10">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-foreground/80">Price ($)</Label>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} className="bg-background/50 border-white/10 focus:border-primary/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fileName"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-foreground/80">File Name</Label>
                    <FormControl>
                      <Input placeholder="script.zip" {...field} className="bg-background/50 border-white/10 focus:border-primary/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <Label className="text-foreground/80">File URL (Simulation)</Label>
                  <FormControl>
                    <Input placeholder="https://example.com/download.zip" {...field} className="bg-background/50 border-white/10 focus:border-primary/50" />
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
                Script will be automatically scanned for viruses upon submission.
              </p>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
