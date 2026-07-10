import { CrmStatus, DataSource } from './enums';
export interface CrmRecord {
    created_at: string;
    name: string;
    email: string;
    country_code: string;
    mobile_without_country_code: string;
    company: string;
    city: string;
    state: string;
    country: string;
    lead_owner: string;
    crm_status: CrmStatus;
    crm_note: string;
    data_source: DataSource | '';
    possession_time: string;
    description: string;
}
export interface SkippedRecord {
    rowNumber: number;
    reason: string;
    rawRowData: Record<string, string>;
}
export interface ImportResult {
    imported: CrmRecord[];
    skipped: SkippedRecord[];
    totalImported: number;
    totalSkipped: number;
    totalProcessed: number;
    successRate: number;
}
