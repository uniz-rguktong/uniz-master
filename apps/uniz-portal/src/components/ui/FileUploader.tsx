import { Button } from "./button";
import { Input } from "./input";
import { useImageUpload } from "../../hooks/use-image-upload";
import {
  FileUp,
  X,
  Upload,
  Trash2,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  label?: string;
  description?: string;
  isUploading?: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  progress?: number;
}

export function FileUploader({
  onFileSelect,
  accept = ".xlsx,.xls,.csv",
  label = "File Upload",
  description = "Supported formats: XLSX, XLS, CSV",
  isUploading,
  isSuccess,
  isError,
  progress,
}: FileUploaderProps) {
  const {
    previewUrl,
    fileName,
    selectedFile,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange,
    handleRemove: baseHandleRemove,
  } = useImageUpload({
    onUpload: (_, file) => {
      onFileSelect(file);
    },
  });

  const handleRemove = useCallback(() => {
    baseHandleRemove();
    onFileSelect(null);
  }, [baseHandleRemove, onFileSelect]);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        const fakeEvent = {
          target: {
            files: [file],
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        handleFileChange(fakeEvent);
      }
    },
    [handleFileChange],
  );

  const isImage = selectedFile?.type.startsWith("image/");

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-dense font-medium text-text">{label}</p>
          <p className="mt-1 text-small text-text-2">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isUploading && (
            <Badge tone="neutral">
              Uploading {typeof progress === "number" ? `${progress}%` : ""}
            </Badge>
          )}
          {isSuccess && !isUploading && <Badge tone="success">Uploaded</Badge>}
          {isError && !isUploading && <Badge tone="error">Failed</Badge>}
        </div>
      </div>

      <Input
        type="file"
        accept={accept}
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {!selectedFile ? (
        <div
          onClick={handleThumbnailClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border-strong bg-surface px-4 py-8 text-center transition-colors hover:bg-surface-2",
            isDragging && "border-head bg-tint",
          )}
        >
          <FileUp className="h-6 w-6 text-text-3" />
          <div>
            <p className="text-dense font-medium text-text">Click to select</p>
            <p className="mt-1 text-caption text-text-3">or drag and drop a file here</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="group relative flex min-h-40 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border-strong bg-surface-2">
            {isImage && previewUrl ? (
              <img src={previewUrl} alt="Preview" className="h-full max-h-48 w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
                {fileName?.endsWith(".csv") ||
                fileName?.endsWith(".xlsx") ||
                fileName?.endsWith(".xls") ? (
                  <FileSpreadsheet className="h-6 w-6 text-text-2" />
                ) : (
                  <FileText className="h-6 w-6 text-text-3" />
                )}
                <span className="max-w-full truncate text-dense font-medium text-text">
                  {fileName}
                </span>
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-bg/80 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                size="compact"
                variant="outline"
                onClick={handleThumbnailClick}
                aria-label="Replace file"
              >
                <Upload className="h-4 w-4" />
                Replace
              </Button>
              <Button
                size="compact"
                variant="destructive"
                onClick={handleRemove}
                aria-label="Remove file"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
          {fileName && (
            <div className="mt-3 flex items-center gap-2 text-caption text-text-3">
              <span className="min-w-0 truncate">{fileName}</span>
              <button
                type="button"
                onClick={handleRemove}
                className="ml-auto rounded-full p-1.5 text-text-2 hover:bg-tint"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
