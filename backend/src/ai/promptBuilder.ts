import { crmSchema } from '../../shared/crmSchema';

/**
 * Builds the prompt instruction for the Groq API (Llama 3.3 70B) to map arbitrary CSV rows
 * to the standardized 15 CRM schema fields.
 */
export const buildPrompt = (rows: Array<Record<string, string>>): string => {
  const schemaDefinitions = Object.values(crmSchema).map((field) => {
    return `- ${field.name} (${field.type}${field.enumValues ? `: [${field.enumValues.join(', ')}]` : ''}): ${field.description}`;
  }).join('\n');

  const serializedRows = JSON.stringify(rows, null, 2);

  return `You are a data mapping assistant. Your task is to analyze a batch of raw CSV records (supplied in JSON format below) and map each raw record to our standardized CRM Lead Schema.

### CRM Lead Schema Fields
${schemaDefinitions}

### Processing Rules
1. **Email Mapping**: Extract the primary email. If multiple emails exist in a field, extract the first one for the "email" field, and append the remaining ones to "crm_note".
2. **Mobile Mapping**: Extract the primary mobile number without the country code. If multiple mobiles exist, extract the first one for the "mobile_without_country_code" field, and append the remaining ones to "crm_note".
3. **Country Code**: Try to extract the country dial code (e.g. +91, +1, +971) and populate the "country_code" field.
4. **Dates**: Ensure the "created_at" field is parseable by JavaScript's 'new Date(value)'. If the raw data contains a timestamp, preserve or reformat it so it is valid.
5. **Enums Validation**:
   - "crm_status" is REQUIRED. Map it logically based on notes, remarks, campaign status, or other indicators to exactly one of the allowed values: [GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE].
   - "data_source" must be mapped to exactly one of the allowed values: [leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots] or left as an empty string "" if it doesn't match any.
6. **No Inventions**: Do not invent information. If a field is not present or cannot be inferred from the raw data, leave it as an empty string "".
7. **Line Breaks**: Ensure there are no literal raw newlines inside any output JSON string values. Use escaped '\\n' characters instead.
8. **Required vs. Skips**: If both "email" and "mobile_without_country_code" are missing or empty for a record, the record is INVALID. In this case, populate "email" and "mobile_without_country_code" as empty strings, but set "crm_status" as "BAD_LEAD" and append a note in "crm_note" explaining "SKIPPED: Missing both email and mobile".
9. **JSON Response format**: You MUST return a JSON object with a single key "records" whose value is an array of objects. Each object in the array must have exactly these 15 keys: [created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description].
10. **Output constraint**: Return ONLY valid JSON. No markdown, no explanation, no backticks. The response must be a JSON object like: {"records": [...]}.
11. **Record count**: You are given exactly ${rows.length} input records. You MUST return exactly ${rows.length} output records in the "records" array, one for each input record, in the same order.

### Raw CSV Records to Map (${rows.length} records):
\`\`\`json
${serializedRows}
\`\`\`
`;
};

export default buildPrompt;
