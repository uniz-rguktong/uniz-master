import { Button } from "./button"
import { Input } from "./input"
import { useImageUpload } from "../../hooks/use-image-upload"
import { FileUp, X, Upload, Trash2, FileText, FileSpreadsheet, CheckCircle2 } from "lucide-react"
import { useCallback, useState } from "react"
import { cn } from "@/lib/utils"

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
    progress
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
    })

    const handleRemove = useCallback(() => {
        baseHandleRemove();
        onFileSelect(null);
    }, [baseHandleRemove, onFileSelect]);

    const [isDragging, setIsDragging] = useState(false)

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault()
            e.stopPropagation()
            setIsDragging(false)

            const file = e.dataTransfer.files?.[0]
            if (file) {
                const fakeEvent = {
                    target: {
                        files: [file],
                    },
                } as unknown as React.ChangeEvent<HTMLInputElement>
                handleFileChange(fakeEvent)
            }
        },
        [handleFileChange],
    )

    const isImage = selectedFile?.type.startsWith("image/");

    return (
        <div className="w-full space-y-4 rounded-2xl border border-slate-100 bg-white/60 backdrop-blur-md p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{label}</h3>
                    <p className="text-sm text-slate-500 font-medium italic opacity-70">
                        {description}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isUploading && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/80 rounded-lg border border-emerald-100 backdrop-blur-sm animate-in fade-in slide-in-from-right-2">
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                Uploading {typeof progress === 'number' ? `${progress}%` : ""}
                            </span>
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin" />
                        </div>
                    )}
                    {isSuccess && !isUploading && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 rounded-lg shadow-sm animate-in zoom-in-95">
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Success</span>
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                    )}
                    {isError && !isUploading && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500 rounded-lg shadow-sm animate-in head-shake">
                            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Failed</span>
                            <X className="h-3.5 w-3.5 text-white" />
                        </div>
                    )}
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
                        "flex h-48 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition-all hover:bg-white hover:border-blue-400 group relative overflow-hidden",
                        isDragging && "border-blue-500 bg-blue-50/50",
                    )}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="rounded-full bg-white p-4 shadow-sm border border-slate-100 transition-transform group-hover:scale-110">
                        <FileUp className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-bold text-slate-900 tracking-tight">Click to select</p>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                            or drag and drop file here
                        </p>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <div className="group relative h-48 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-center">
                        {isImage && previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                {fileName?.endsWith('.csv') || fileName?.endsWith('.xlsx') || fileName?.endsWith('.xls') ? (
                                    <FileSpreadsheet className="h-12 w-12 text-blue-600" />
                                ) : (
                                    <FileText className="h-12 w-12 text-slate-400" />
                                )}
                                <span className="text-sm font-bold text-slate-900 max-w-[200px] truncate">
                                    {fileName}
                                </span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-[2px]" />
                        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleThumbnailClick}
                                className="h-10 w-10 p-0 rounded-full shadow-lg"
                            >
                                <Upload className="h-4 w-4" />
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleRemove}
                                className="h-10 w-10 p-0 rounded-full shadow-lg"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    {fileName && (
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                            <span className="truncate">{fileName}</span>
                            <button
                                onClick={handleRemove}
                                className="ml-auto rounded-full p-1.5 hover:bg-slate-100 text-red-500 transition-colors"
                                title="Remove file"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
