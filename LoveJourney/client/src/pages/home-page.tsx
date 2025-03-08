import { useAuth } from "@/hooks/use-auth";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertRelationshipSchema, linkPartnerSchema, type Relationship } from "@shared/schema";
import { Heart, CalendarHeart, Clock, Copy, Share2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { differenceInDays, format } from "date-fns";

function LinkPartnerForm() {
  const form = useForm({
    resolver: zodResolver(linkPartnerSchema),
    defaultValues: {
      partnerCode: "",
    },
  });

  const { toast } = useToast();
  const linkPartner = useMutation({
    mutationFn: async (data: { partnerCode: string }) => {
      const res = await apiRequest("POST", "/api/relationship/link", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/relationship"] });
      toast({
        title: "Partners linked!",
        description: "You're now connected with your partner.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error linking partners",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join Your Partner</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Enter the partner code shared by your significant other to connect your accounts.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => linkPartner.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="partnerCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter the 8-character code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Connect with Partner
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function RelationshipForm() {
  const form = useForm({
    resolver: zodResolver(insertRelationshipSchema),
    defaultValues: {
      partnerName: "",
      anniversary: "",
      description: "",
    },
  });

  const { toast } = useToast();
  const createRelationship = useMutation({
    mutationFn: async (data: {
      partnerName: string;
      anniversary: string;
      description: string;
    }) => {
      const res = await apiRequest("POST", "/api/relationship", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/relationship"] });
      toast({
        title: "Relationship created",
        description: "Share your partner code to connect with your significant other!",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Start Your Love Journey</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => createRelationship.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="partnerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partner's Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="anniversary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anniversary Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Your Story</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="How did you meet?" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Begin Journey
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function RelationshipDisplay({ relationship }: { relationship: Relationship }) {
  const { toast } = useToast();
  const daysCount = differenceInDays(new Date(), new Date(relationship.anniversary));

  const handleCopyCode = () => {
    navigator.clipboard.writeText(relationship.partnerCode);
    toast({
      title: "Partner code copied!",
      description: "Share this code with your significant other to connect.",
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            Your Love Story
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <CalendarHeart className="h-8 w-8 text-primary" />
              <div>
                <p className="text-lg font-semibold">Anniversary</p>
                <p className="text-muted-foreground">
                  {format(new Date(relationship.anniversary), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-lg font-semibold">Days Together</p>
                <p className="text-3xl font-bold text-primary">{daysCount}</p>
              </div>
            </div>
            {!relationship.partnerUserId && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">Your Partner Code</p>
                  <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <p className="text-xl font-mono text-primary">{relationship.partnerCode}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Share this code with your partner to connect your accounts.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partner</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-primary">{relationship.partnerName}</p>
          <p className="mt-2 text-muted-foreground">{relationship.description}</p>
          {!relationship.partnerUserId && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Waiting for your partner to join...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function HomePage() {
  const { data: relationship } = useQuery<Relationship>({
    queryKey: ["/api/relationship"],
  });

  return (
    <div className="min-h-screen lg:flex">
      <SidebarNav />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8 bg-background">
        <div className="max-w-5xl mx-auto">
          {relationship ? (
            <>
              <RelationshipDisplay relationship={relationship} />
              {!relationship.partnerUserId && (
                <div className="mt-8">
                  <LinkPartnerForm />
                </div>
              )}
            </>
          ) : (
            <RelationshipForm />
          )}
        </div>
      </main>
    </div>
  );
}