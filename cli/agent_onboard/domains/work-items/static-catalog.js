'use strict';

const WORK_ITEMS_SCHEMA = {
  schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'agent-onboard-target-work-items-001',
  type: 'object',
  required: ['schema', 'package_name', 'vocabulary', 'programs', 'stages', 'milestones', 'work_items'],
  additionalProperties: false,
  properties: {
    schema: { const: 'agent-onboard-target-work-items-001' },
    package_name: { const: 'agent-onboard' },
    vocabulary: {
      type: 'object',
      required: ['program', 'stage', 'milestone', 'work_item'],
      additionalProperties: false,
      properties: {
        program: {
          type: 'object',
          required: ['prefix', 'name', 'description'],
          additionalProperties: false,
          properties: {
            prefix: { const: 'P' },
            name: { const: 'Program' },
            description: { type: 'string', minLength: 1 }
          }
        },
        stage: {
          type: 'object',
          required: ['prefix', 'name', 'description'],
          additionalProperties: false,
          properties: {
            prefix: { const: 'S' },
            name: { const: 'Stage' },
            description: { type: 'string', minLength: 1 }
          }
        },
        milestone: {
          type: 'object',
          required: ['prefix', 'name', 'description'],
          additionalProperties: false,
          properties: {
            prefix: { const: 'M' },
            name: { const: 'Milestone' },
            description: { type: 'string', minLength: 1 }
          }
        },
        work_item: {
          type: 'object',
          required: ['prefix', 'name', 'description'],
          additionalProperties: false,
          properties: {
            prefix: { const: 'W' },
            name: { const: 'Work Item' },
            description: { type: 'string', minLength: 1 }
          }
        }
      }
    },
    programs: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'status'],
        additionalProperties: false,
        properties: {
          id: { type: 'string', pattern: '^P[0-9]+$' },
          title: { type: 'string', minLength: 1 },
          status: { enum: ['open', 'closed'] }
        }
      }
    },
    stages: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'program_id', 'title', 'status'],
        additionalProperties: false,
        properties: {
          id: { type: 'string', pattern: '^P[0-9]+S[0-9]+$' },
          program_id: { type: 'string', pattern: '^P[0-9]+$' },
          title: { type: 'string', minLength: 1 },
          status: { enum: ['open', 'closed'] }
        }
      }
    },
    milestones: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'stage_id', 'title', 'status'],
        additionalProperties: false,
        properties: {
          id: { type: 'string', pattern: '^P[0-9]+S[0-9]+M[0-9]+$' },
          stage_id: { type: 'string', pattern: '^P[0-9]+S[0-9]+$' },
          title: { type: 'string', minLength: 1 },
          status: { enum: ['open', 'closed'] }
        }
      }
    },
    work_items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'milestone_id', 'title', 'status'],
        additionalProperties: false,
        properties: {
          id: { type: 'string', pattern: '^P[0-9]+S[0-9]+M[0-9]+W[0-9]+$' },
          milestone_id: { type: 'string', pattern: '^P[0-9]+S[0-9]+M[0-9]+$' },
          title: { type: 'string', minLength: 1 },
          status: { enum: ['open', 'claimed', 'closed'] },
          claim: {
            type: 'object',
            required: ['actor', 'claimed_at'],
            additionalProperties: false,
            properties: {
              actor: { type: 'string', minLength: 1 },
              claimed_at: { type: 'string', minLength: 1 },
              note: { type: 'string', minLength: 1 }
            }
          },
          closure: {
            type: 'object',
            required: ['actor', 'closed_at', 'summary', 'changed_files', 'checks_run', 'checks_not_run', 'known_non_pass'],
            additionalProperties: false,
            properties: {
              actor: { type: 'string', minLength: 1 },
              closed_at: { type: 'string', minLength: 1 },
              summary: { type: 'string', minLength: 1 },
              changed_files: { type: 'array', items: { type: 'string', minLength: 1 } },
              checks_run: { type: 'array', items: { type: 'string', minLength: 1 } },
              checks_not_run: { type: 'array', items: { type: 'string', minLength: 1 } },
              known_non_pass: { type: 'array', items: { type: 'string', minLength: 1 } }
            }
          }
        }
      }
    }
  }
};

module.exports = {
  WORK_ITEMS_SCHEMA
};
