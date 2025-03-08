import { useAuth } from "@/hooks/use-auth";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, LockKeyhole, Unlock } from "lucide-react";
import type { DailyQuestion } from "@shared/schema";

const SAMPLE_QUESTIONS = [
  "What made you smile today?",
  "What's one thing you appreciate about me?",
  "What's your favorite memory of us together?",
  "Where would you like us to travel next?",
  "What makes our relationship special?",
];

export default function DailyQuestions() {
  const [selectedDate] = useState(new Date());
  const { toast } = useToast();
  const [isCreatingFirst, setIsCreatingFirst] = useState(false);

  const { data: questions, isLoading } = useQuery<DailyQuestion[]>({
    queryKey: ["/api/questions", format(selectedDate, "yyyy-MM-dd")],
  });

  const createQuestion = useMutation({
    mutationFn: async () => {
      const randomQuestion = SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)];
      const res = await apiRequest("POST", "/api/questions", {
        question: randomQuestion,
        date: format(selectedDate, "yyyy-MM-dd"),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      toast({
        title: "New question created",
        description: "Time to share your thoughts!",
      });
    },
  });

  const answerQuestion = useMutation({
    mutationFn: async ({
      id,
      answer,
      isUser,
    }: {
      id: number;
      answer: string;
      isUser: boolean;
    }) => {
      const res = await apiRequest("PATCH", `/api/questions/${id}/answer`, {
        answer,
        isUser,
      });
      const updatedQuestion = await res.json();

      // If both partners have answered, create a new question
      if (updatedQuestion.userAnswer && updatedQuestion.partnerAnswer) {
        await createQuestion.mutateAsync();
      }

      return updatedQuestion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    },
  });

  // Handle initial question creation
  useEffect(() => {
    if (!isLoading && !isCreatingFirst && (!questions || questions.length === 0)) {
      setIsCreatingFirst(true);
      createQuestion.mutate();
    }
  }, [isLoading, questions, isCreatingFirst]);

  if (isLoading) {
    return (
      <div className="min-h-screen lg:flex">
        <SidebarNav />
        <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:flex">
      <SidebarNav />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8 bg-background overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold">Daily Questions</h1>
          </div>

          {questions?.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle>{question.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Your Answer</h3>
                  {question.userAnswer ? (
                    <p className="text-muted-foreground">{question.userAnswer}</p>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Share your thoughts..."
                        onChange={(e) =>
                          answerQuestion.mutate({
                            id: question.id,
                            answer: e.target.value,
                            isUser: true,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    Partner's Answer
                    {question.partnerAnswer ? (
                      <Unlock className="h-4 w-4 text-primary" />
                    ) : (
                      <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                    )}
                  </h3>
                  {question.partnerAnswer ? (
                    <p className="text-muted-foreground">
                      {question.partnerAnswer}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      Waiting for your partner's response...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {(!questions || questions.length === 0) && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Creating your first question...
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}