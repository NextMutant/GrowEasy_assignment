export interface CrmFieldDefinition {
    name: string;
    type: 'string' | 'date' | 'enum';
    description: string;
    required: boolean;
    enumValues?: readonly string[];
}
export declare const crmSchema: Record<string, CrmFieldDefinition>;
