import { Card, CardContent } from "@/components/ui/card";

export function ProcessingView() {
    return (
        <Card className="w-full max-w-md mx-auto p-8">
            <CardContent className="flex flex-col items-center justify-center p-0 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-lg font-medium">파일 처리 중...</p>
                <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
            </CardContent>
        </Card>
    );
}
