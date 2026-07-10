"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crmSchema = void 0;
exports.crmSchema = {
    created_at: {
        name: 'created_at',
        type: 'date',
        description: 'The date and time when the lead was created. Must be parseable by Javascript Date constructor.',
        required: false,
    },
    name: {
        name: 'name',
        type: 'string',
        description: 'Full name of the lead.',
        required: false,
    },
    email: {
        name: 'email',
        type: 'string',
        description: 'Lead primary email address. If multiple emails exist in the row, extract the first one here, and append the remaining ones to crm_note.',
        required: false,
    },
    country_code: {
        name: 'country_code',
        type: 'string',
        description: 'Country dial code (e.g., +91, +1, +971). Make sure it starts with a plus sign if possible, or is a plain number.',
        required: false,
    },
    mobile_without_country_code: {
        name: 'mobile_without_country_code',
        type: 'string',
        description: 'Mobile number excluding the country code. If multiple mobile numbers exist in the row, extract the first one here, and append the remaining ones to crm_note.',
        required: false,
    },
    company: {
        name: 'company',
        type: 'string',
        description: 'Name of the company the lead works for.',
        required: false,
    },
    city: {
        name: 'city',
        type: 'string',
        description: 'City of residence or interest.',
        required: false,
    },
    state: {
        name: 'state',
        type: 'string',
        description: 'State or region of residence or interest.',
        required: false,
    },
    country: {
        name: 'country',
        type: 'string',
        description: 'Country of residence or interest.',
        required: false,
    },
    lead_owner: {
        name: 'lead_owner',
        type: 'string',
        description: 'Name or identifier of the lead owner or salesperson assigned to the lead.',
        required: false,
    },
    crm_status: {
        name: 'crm_status',
        type: 'enum',
        description: 'Lead status in CRM. Must be EXACTLY one of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE. Map logically based on notes, comments, or status columns.',
        required: true,
        enumValues: ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'],
    },
    crm_note: {
        name: 'crm_note',
        type: 'string',
        description: 'Additional notes, comments, or logs about the lead. MUST also append extra emails or mobile numbers found in the row here.',
        required: false,
    },
    data_source: {
        name: 'data_source',
        type: 'enum',
        description: 'Source of the lead. Must be EXACTLY one of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots, or empty if none applies.',
        required: false,
        enumValues: ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'],
    },
    possession_time: {
        name: 'possession_time',
        type: 'string',
        description: 'Possession time frame or interest timeline mentioned (e.g. "Ready to move", "3 months", "Immediate").',
        required: false,
    },
    description: {
        name: 'description',
        type: 'string',
        description: 'General description, project requirements, campaign name, or form description.',
        required: false,
    },
};
//# sourceMappingURL=crmSchema.js.map