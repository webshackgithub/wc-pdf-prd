"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, FileWarning, FileType } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadViewProps {
  onUpload: (file: File) => void;
}

const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function UploadView({ onUpload }: UploadViewProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      // 1. Handle Rejected Files (Validation Errors)
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const error = rejection.errors[0];

        if (error.code === "file-invalid-type") {
          toast.error("지원하지 않는 파일 형식입니다.", {
            description: "PDF 파일만 업로드 가능합니다.",
            icon: <FileType className="h-4 w-4 text-red-500" />,
          });
        } else if (error.code === "file-too-large") {
          toast.error("파일 용량이 너무 큽니다.", {
            description: `최대 ${MAX_FILE_SIZE_MB}MB까지 업로드 가능합니다.`,
            icon: <FileWarning className="h-4 w-4 text-red-500" />,
          });
        } else {
          toast.error("파일 업로드 실패", {
            description: "올바른 PDF 파일을 선택해주세요.",
          });
        }
        return;
      }

      // 2. Handle Accepted File
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        console.log("File accepted:", file.name);
        onUpload(file);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
      },
      maxSize: MAX_FILE_SIZE_BYTES,
      maxFiles: 1,
      multiple: false,
    });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "w-full max-w-md mx-auto p-12 border-2 border-dashed transition-all cursor-pointer bg-gray-50 dark:bg-gray-900/50",
        isDragActive
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-gray-300 hover:border-gray-400 dark:border-gray-800 dark:hover:border-gray-700",
        isDragReject && "border-red-500 bg-red-50 dark:bg-red-900/10"
      )}
    >
      <input {...getInputProps()} />
      <CardContent className="flex flex-col items-center justify-center p-0 space-y-4 text-center pointer-events-none">
        <div
          className={cn(
            "p-4 rounded-full shadow-sm transition-colors",
            isDragActive ? "bg-primary text-primary-foreground" : "bg-white dark:bg-gray-800",
            isDragReject && "bg-red-100 text-red-500"
          )}
        >
          {isDragReject ? (
            <FileWarning className="w-8 h-8" />
          ) : (
            <UploadCloud className={cn("w-8 h-8", !isDragActive && "text-primary")} />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium">
            {isDragActive
              ? isDragReject
                ? "업로드 불가능한 파일입니다"
                : "파일을 여기에 놓으세요"
              : "PDF 파일 업로드"}
          </p>
          <p className="text-sm text-muted-foreground">
            파일을 드래그하거나 클릭하여 선택하세요
            <br />
            <span className="text-xs text-gray-400">(최대 {MAX_FILE_SIZE_MB}MB)</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
