import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeoScore {
  score: number;
  message: string;
  type: 'success' | 'warning' | 'error';
}

interface SeoAnalysisProps {
  content: string;
  focusKeyword: string;
  title: string;
  metaDescription: string;
}

export function SeoAnalysis({ content, focusKeyword, title, metaDescription }: SeoAnalysisProps) {
  const analyzeContent = (): SeoScore[] => {
    const scores: SeoScore[] = [];
    
    // Focus keyword analysis
    if (!focusKeyword) {
      scores.push({
        score: 0,
        message: "No focus keyword set",
        type: 'error'
      });
    } else {
      const keywordDensity = (content.toLowerCase().split(focusKeyword.toLowerCase()).length - 1) / 
        content.split(' ').length * 100;
      
      if (keywordDensity < 0.5) {
        scores.push({
          score: 5,
          message: "Focus keyword density is too low",
          type: 'warning'
        });
      } else if (keywordDensity > 2.5) {
        scores.push({
          score: 5,
          message: "Focus keyword density is too high",
          type: 'warning'
        });
      } else {
        scores.push({
          score: 10,
          message: "Good keyword density",
          type: 'success'
        });
      }

      // Check keyword in title
      if (title.toLowerCase().includes(focusKeyword.toLowerCase())) {
        scores.push({
          score: 10,
          message: "Focus keyword found in title",
          type: 'success'
        });
      } else {
        scores.push({
          score: 5,
          message: "Focus keyword not found in title",
          type: 'warning'
        });
      }
    }

    // Title length analysis
    if (title.length < 30) {
      scores.push({
        score: 5,
        message: "Title is too short (min. 30 characters)",
        type: 'warning'
      });
    } else if (title.length > 60) {
      scores.push({
        score: 5,
        message: "Title is too long (max. 60 characters)",
        type: 'warning'
      });
    } else {
      scores.push({
        score: 10,
        message: "Title length is good",
        type: 'success'
      });
    }

    // Meta description analysis
    if (!metaDescription) {
      scores.push({
        score: 0,
        message: "No meta description set",
        type: 'error'
      });
    } else if (metaDescription.length < 120) {
      scores.push({
        score: 5,
        message: "Meta description is too short (min. 120 characters)",
        type: 'warning'
      });
    } else if (metaDescription.length > 156) {
      scores.push({
        score: 5,
        message: "Meta description is too long (max. 156 characters)",
        type: 'warning'
      });
    } else {
      scores.push({
        score: 10,
        message: "Meta description length is good",
        type: 'success'
      });
    }

    return scores;
  };

  const scores = analyzeContent();
  const overallScore = Math.round(scores.reduce((acc, score) => acc + score.score, 0) / scores.length);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 5) return "text-yellow-500";
    return "text-red-500";
  };

  const getIcon = (type: 'success' | 'warning' | 'error') => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={cn("text-2xl font-bold", getScoreColor(overallScore))}>
          {overallScore}/10
        </span>
        <span className="text-sm text-muted-foreground">SEO Score</span>
      </div>

      <div className="space-y-2">
        {scores.map((score, index) => (
          <Alert key={index} variant={score.type === 'error' ? 'destructive' : 'default'}>
            {getIcon(score.type)}
            <AlertDescription className="ml-2">{score.message}</AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
}