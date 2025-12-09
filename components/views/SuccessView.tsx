import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, RotateCcw } from "lucide-react";
import { saveAs } from "file-saver";

interface SuccessViewProps {
    zipBlob: Blob | null;
    fileName: string;
    onReset: () => void;
}

export function SuccessView({ zipBlob, fileName, onReset }: SuccessViewProps) {
    const handleDownload = () => {
        if (!zipBlob) return;
        const downloadName = fileName ? fileName.replace(/\.pdf$/i, ".zip") : "split-pages.zip";
        saveAs(zipBlob, downloadName);
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <CardTitle className="text-xl">변환 완료!</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground space-y-2">
                <p>PDF 분할 및 ZIP 압축이 완료되었습니다.</p>
                {fileName && <p className="text-sm font-medium text-foreground">{fileName}</p>}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <Button className="w-full gap-2" size="lg" onClick={handleDownload} disabled={!zipBlob}>
                    <Download className="w-4 h-4" />
                    ZIP 다운로드
                </Button>
                <Button variant="ghost" className="w-full gap-2" onClick={onReset}>
                    <RotateCcw className="w-4 h-4" />
                    처음으로
                </Button>
            </CardFooter>
        </Card>
    );
}
