import { crmRecordSchema } from '../src/validation/crmValidator';

describe('CRM Validator Schema', () => {
  it('should validate a correct record', () => {
    const valid = {
      created_at: '2026-07-10T12:00:00Z',
      name: 'John Doe',
      email: 'john@example.com',
      country_code: '+91',
      mobile_without_country_code: '9876543210',
      company: 'Acme Corp',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      lead_owner: 'Saurabh Shah',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      crm_note: 'Interested in plots',
      data_source: 'eden_park',
      possession_time: '3 months',
      description: 'Interested',
    };

    const parseResult = crmRecordSchema.safeParse(valid);
    expect(parseResult.success).toBe(true);
    expect(parseResult.data?.crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
  });

  it('should accept missing fields if email is present', () => {
    const record = {
      email: 'john@example.com',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
    };

    const parseResult = crmRecordSchema.safeParse(record);
    expect(parseResult.success).toBe(true);
    expect(parseResult.data?.name).toBe('');
    expect(parseResult.data?.data_source).toBe('');
  });

  it('should accept missing fields if mobile is present', () => {
    const record = {
      mobile_without_country_code: '9876543210',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
    };

    const parseResult = crmRecordSchema.safeParse(record);
    expect(parseResult.success).toBe(true);
  });

  it('should reject if both email and mobile are missing', () => {
    const record = {
      name: 'John Doe',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
    };

    const parseResult = crmRecordSchema.safeParse(record);
    expect(parseResult.success).toBe(false);
  });

  it('should reject invalid crm_status', () => {
    const record = {
      email: 'john@example.com',
      crm_status: 'INVALID_STATUS',
    };

    const parseResult = crmRecordSchema.safeParse(record);
    expect(parseResult.success).toBe(false);
  });

  it('should reject invalid data_source', () => {
    const record = {
      email: 'john@example.com',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      data_source: 'invalid_source',
    };

    const parseResult = crmRecordSchema.safeParse(record);
    expect(parseResult.success).toBe(false);
  });

  it('should transform empty data_source to empty string', () => {
    const record = {
      email: 'john@example.com',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      data_source: '',
    };

    const parseResult = crmRecordSchema.safeParse(record);
    expect(parseResult.success).toBe(true);
    expect(parseResult.data?.data_source).toBe('');
  });

  it('should handle invalid dates by failing validation', () => {
    const record = {
      email: 'john@example.com',
      crm_status: 'GOOD_LEAD_FOLLOW_UP',
      created_at: 'not-a-date',
    };

    const parseResult = crmRecordSchema.safeParse(record);
    expect(parseResult.success).toBe(false);
  });
});
