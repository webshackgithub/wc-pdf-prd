"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Trash2, ArrowUp, ArrowDown, Merge, Plus } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Document, Page, pdfjs } from "react-pdf";

// Worker 설정 (다른 뷰와 동일하게)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface MergePrepViewProps {
    files: File[];
    onFilesChange: (files: File[]) => void;
    onStart: () => void;
    onCancel: () => void;
}

export function MergePrepView({ files, onFilesChange, onStart, onCancel }: MergePrepViewProps) {

    const moveUp = (index: number) => {
        if (index === 0) return;
        const newFiles = [...files];
        [newFiles[index - 1], newFiles[index]] = [newFiles[index], newFiles[index - 1]];
        onFilesChange(newFiles);
    };

    const moveDown = (index: number) => {
        if (index === files.length - 1) return;
        const newFiles = [...files];
        [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
        onFilesChange(newFiles);
    };

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        onFilesChange(newFiles);
    };

    // 추가 파일 업로드
    const { getRootProps, getInputProps } = useDropzone({
        onDrop: (acceptedFiles) => {
            onFilesChange([...files, ...acceptedFiles]);
        },
        accept: { 'application/pdf': ['.pdf'] },
        multiple: true
    });

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <Card className="bg-white/90 dark:bg-gray-900/90 backdrop-blur">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Merge className="w-6 h-6 text-blue-500" />
                        PDF 병합 목록 ({files.length}개)
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">
                        병합할 순서대로 파일을 정렬하세요.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* File List */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                        {files.map((file, index) => (
                            <div
                                key={`${file.name}-${index}`}
                                className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 overflow-hidden">
                                    {/* Thumbnail */}
                                    <div className="w-[60px] h-[80px] bg-gray-100 dark:bg-gray-800 rounded overflow-hidden shrink-0 border flex items-center justify-center relative">
                                        <Document
                                            file={file}
                                            loading={
                                                <div className="flex items-center justify-center w-full h-full text-gray-400">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                            }
                                            className="flex items-center justify-center w-full h-full"
                                        >
                                            <Page
                                                pageNumber={1}
                                                height={80} // Fix height to match container
                                                className="block max-w-full max-h-full object-contain"
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                        </Document>
                                    </div>

                                    {/* File Info */}
                                    <div className="min-w-0">
                                        <p className="font-medium truncate text-sm">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost" size="icon"
                                        onClick={() => moveUp(index)}
                                        disabled={index === 0}
                                        title="위로 이동"
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="icon"
                                        onClick={() => moveDown(index)}
                                        disabled={index === files.length - 1}
                                        title="아래로 이동"
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </Button>
                                    <div className="w-px h-6 bg-border mx-1" />
                                    <Button
                                        variant="ghost" size="icon"
                                        onClick={() => removeFile(index)}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add More Files */}
                    <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                        <input {...getInputProps()} />
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Plus className="w-5 h-5" />
                            <span>파일 추가하기</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onCancel}>
                            취소
                        </Button>
                        <Button
                            onClick={onStart}
                            disabled={files.length < 2}
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                        >
                            <Merge className="w-4 h-4" />
                            {files.length}개 파일 병합 시작
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
