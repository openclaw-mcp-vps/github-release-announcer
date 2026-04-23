import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface MessagePreviewProps {
  message: string;
}

export function MessagePreview({ message }: MessagePreviewProps) {
  return (
    <Card className="border-sky-900/60 bg-slate-900/50">
      <CardHeader>
        <CardTitle className="text-base text-sky-300">Live Message Preview</CardTitle>
        <CardDescription>
          This is the release message that will be broadcast when GitHub sends a new published release event.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-200">
          {message}
        </pre>
      </CardContent>
    </Card>
  );
}
