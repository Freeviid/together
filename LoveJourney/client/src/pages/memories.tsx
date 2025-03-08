import { useAuth } from "@/hooks/use-auth";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { insertMemorySchema, type Memory } from "@shared/schema";
import { Plus, Trash2, Image, Calendar } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function CreateMemoryDialog() {
  const form = useForm({
    resolver: zodResolver(insertMemorySchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      date: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const { toast } = useToast();
  const createMemory = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      imageUrl: string;
      date: string;
    }) => {
      const res = await apiRequest("POST", "/api/memories", {
        ...data,
        date: new Date(data.date),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      toast({
        title: "Memory created",
        description: "Your special moment has been saved!",
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Memory
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Memory</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createMemory.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Save Memory
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function Memories() {
  const { data: memories } = useQuery<Memory[]>({
    queryKey: ["/api/memories"],
  });

  const { toast } = useToast();
  const deleteMemory = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/memories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/memories"] });
      toast({
        title: "Memory deleted",
        description: "The memory has been removed",
      });
    },
  });

  return (
    <div className="min-h-screen lg:flex">
      <SidebarNav />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8 bg-background overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-semibold">Memories</h1>
            <CreateMemoryDialog />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {memories?.map((memory) => (
              <Card key={memory.id} className="overflow-hidden">
                <div
                  className="aspect-video bg-cover bg-center"
                  style={{ backgroundImage: `url(${memory.imageUrl})` }}
                />
                <CardHeader>
                  <CardTitle>{memory.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {memory.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(memory.date), "MMM d, yyyy")}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMemory.mutate(memory.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!memories || memories.length === 0) && (
            <Card>
              <CardContent className="py-8 text-center">
                <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No memories yet. Start capturing your special moments!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}