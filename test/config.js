/* eslint-disable max-len */
module.exports = {
  endpoint: 'ws://127.0.0.1:9944',
  types: {
    ProjectIndex: 'u32',
    ProjectOf: 'Project',
    RoundIndex: 'u32',
    RoundOf: 'Round',
    Round: {
      start: 'BlockNumber',
      end: 'BlockNumber',
      matching_fund: 'Balance',
      grants: 'Vec<Grant>',
      is_canceled: 'bool',
      is_finalized: 'bool',
    },
    Grant: {
      project_index: 'ProjectIndex',
      contributions: 'Vec<Contribution>',
      is_approved: 'bool',
      is_canceled: 'bool',
      is_withdrawn: 'bool',
      withdrawal_expiration: 'BlockNumber',
      matching_fund: 'Balance',
    },
    Contribution: {
      account_id: 'AccountId',
      value: 'Balance',
    },
    Project: {
      name: 'Vec<u8>',
      logo: 'Vec<u8>',
      description: 'Vec<u8>',
      website: 'Vec<u8>',
      owner: 'AccountId',
      create_block_numbe: 'BlockNumber',
    },
  },
  rpc: {
    getProjects: {
      description: 'getProjects',
      params: [],
      type: 'Vec<Project>',
    },
  },
};
