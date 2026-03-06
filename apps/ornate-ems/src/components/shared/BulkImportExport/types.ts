export type BulkImportExportVariant = 'admin' | 'clubs' | 'sports';

export interface BulkImportExportConfig {
    importGuidelines: string[];
    requiredColumns: string[];
    exportFields: string[];
    showBranchFilter?: boolean;
    templateName: string;
}

export interface ImportHistoryItem {
    id: string;
    filename: string;
    importDate: string | Date;
    records: number;
    successful: number;
    failed: number;
    status: string;
}

export interface ExportHistoryItem {
    id: string;
    name: string;
    createdAt: Date;
    size: string;
    url: string;
}
