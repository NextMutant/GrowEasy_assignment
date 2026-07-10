import { z } from 'zod';
import { CRM_STATUS_VALUES, DATA_SOURCE_VALUES } from '@shared/enums';

/**
 * Zod validation schema for a normalized CRM record.
 * Handles type coercions and specific validation constraints.
 */
export const crmRecordSchema = z.object({
  created_at: z.string()
    .nullish()
    .superRefine((val, ctx) => {
      if (val && val.trim() !== '') {
        const d = new Date(val);
        if (isNaN(d.getTime())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Invalid Date',
          });
        }
      }
    })
    .transform((val) => {
      if (!val || val.trim() === '') {
        return new Date().toISOString();
      }
      return new Date(val).toISOString();
    }),
  
  name: z.string().nullish().transform(v => v || '').default(''),
  email: z.string().nullish().transform(v => v || '').default(''),
  country_code: z.string().nullish().transform(v => v || '').default(''),
  mobile_without_country_code: z.string().nullish().transform(v => v || '').default(''),
  company: z.string().nullish().transform(v => v || '').default(''),
  city: z.string().nullish().transform(v => v || '').default(''),
  state: z.string().nullish().transform(v => v || '').default(''),
  country: z.string().nullish().transform(v => v || '').default(''),
  lead_owner: z.string().nullish().transform(v => v || '').default(''),
  
  crm_status: z.enum(['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'], {
    invalid_type_error: `crm_status must be one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE`,
  }),
  
  crm_note: z.string().nullish().transform(v => v || '').default(''),
  
  data_source: z.preprocess((val) => {
    if (val === undefined || val === null || val === '') return '';
    return val;
  }, z.enum(['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots', '']).default('')),
  
  possession_time: z.string().nullish().transform(v => v || '').default(''),
  description: z.string().nullish().transform(v => v || '').default(''),
}).refine((data) => {
  // Reject if both email and mobile_without_country_code are empty
  const hasEmail = data.email && data.email.trim().length > 0;
  const hasMobile = data.mobile_without_country_code && data.mobile_without_country_code.trim().length > 0;
  return hasEmail || hasMobile;
}, {
  message: 'Missing both email and mobile: at least one contact channel must be present.',
  path: ['email', 'mobile_without_country_code'],
});

export type ValidatedCrmRecord = z.infer<typeof crmRecordSchema>;
