/* eslint-disable max-len */
/* eslint-disable no-async-promise-executor */
const { ApiPromise, WsProvider, Keyring } = require('@polkadot/api');
const { cryptoWaitReady } = require('@polkadot/util-crypto');
const _ = require('lodash');

const config = require('./config');
const ExtrinsicsTypes = require('./extrinsicsTypes');

class QuadraticFunding {
  constructor() {
    this.api = '';
    this.sudoOrigin = '';
    this.projectOrigin = '';
    this.userOrigin = '';
  }

  // Initial the accounts and api
  async init() {
    await this.initAccounts();
    await this.initApi();
  }

  // Initial the origin account: sudoOrigin, projectOrigin, userPrigin
  async initAccounts() {
    if (_.isEmpty(this.origin)) {
      await cryptoWaitReady();
      const keyring = new Keyring({ type: 'sr25519' });
      const origin = keyring.addFromUri('//Alice');

      // sudoOrigin, projectOrigin, userOrigin can be the same account in the test environment.
      this.sudoOrigin = origin;
      this.projectOrigin = origin;
      this.userOrigin = origin;
    }
  }

  // Initial the Polkadot.js api promise
  async initApi() {
    if (_.isEmpty(this.api)) {
      const { endpoint, types } = config;
      const wsProvider = new WsProvider(endpoint);
      const api = await ApiPromise.create({
        provider: wsProvider,
        types,
      });

      this.api = api;
    }
  }

  // Storage Module

  /**
   * Read the QuadraticFunding's storage data
   * @param {*} method QuadraticFunding's method name
   * @param  {...any} args QuadraticFunding's method's params
   */
  readStorage(method, ...args) {
    return this.api.query.quadraticFunding[method](...args);
  }

  async getCurrentBlockNumber() {
    const blockNumber = await this.api.query.system.number();
    return blockNumber.toNumber();
  }

  async getProjectCount() {
    const projectCount = await this.readStorage('projectCount');
    return projectCount.toNumber();
  }

  async getProjectInfo(projectIndex) {
    const projectInfo = await this.readStorage('projects', projectIndex);
    return projectInfo;
  }

  async getMaxGrantCountPerRound() {
    const maxGrantCountPerRound = await this.readStorage('maxGrantCountPerRound');
    return maxGrantCountPerRound.toNumber();
  }

  async getGrantRoundCount() {
    const roundCount = await this.readStorage('roundCount');
    return roundCount.toNumber();
  }

  async getGrantRoundInfo(grantRoundIndex) {
    const roundInfo = await this.readStorage('rounds', grantRoundIndex);
    return roundInfo;
  }

  // Subscribe module

  /**
   * Subscribe the current block number
   *
   * @param {*} waitBlockNumber target block number
   * @returns {boolean} return true when current block number is larger than target block number
   */
  waitForBlockNumber(waitBlockNumber) {
    return new Promise(async (resolve) => {
      const unsub = await this.api.rpc.chain.subscribeNewHeads((header) => {
        const blockNumber = header.number.toNumber();

        if (blockNumber > waitBlockNumber) {
          unsub();
          resolve(true);
        }
      });
    });
  }

  /**
   * Using origin account to sign the extrinsics and send, then subscribe the result when finalized
   *
   * @param {*} extrinsic Extrinsic instance
   * @param {*} origin Sign origin account
   * @param {*} extrinsicType Extrinsic type: { method: '', event: '' }
   * @returns {object || Error} return an object if this extrinsic is finalized; return error when extrinsic is failed or no response event
   *
   */
  static signAndSubscribeExtrinsic(extrinsic, origin, extrinsicType) {
    return new Promise(async (resolve, reject) => {
      const { method, event } = extrinsicType;
      const unsub = await extrinsic.signAndSend(origin, async ({ events = [], status }) => {
        if (status.isFinalized) {
          unsub();
          const { response, error, success } = QuadraticFunding.getMethodResponseFromEvents(events, event);
          if (!_.isEmpty(error)) {
            reject(error);
          } else if (!_.isEmpty(response) || success) {
            resolve(response || success);
          } else {
            reject(new Error(`${method} method has no response event`));
          }
        } else if (status.type === 'Invalid') {
          unsub();
          reject(new Error(`${method} is invalid`));
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }

  // Extrinsics module

  /**
   * Create QuadraticFunding's extrinsic instance
   * @param {*} method QuadraticFunding's method name
   * @param  {...any} args QuadraticFunding's method's params
   */
  createQuadraticFundingExtrinsic(method, ...args) {
    return this.api.tx.quadraticFunding[method](...args);
  }

  /**
   * Create QuadraticFunding's extrinsic instance by sudo module
   * @param {*} method QuadraticFunding's method name
   * @param  {...any} args QuadraticFunding's method's params
   * @returns
   */
  async createQuadraticFundingExtrinsicBySudo(method, ...args) {
    const call = await this.createQuadraticFundingExtrinsic(method, ...args);
    return this.api.tx.sudo.sudo(call);
  }

  /**
   * Create QuadraticFunding.createProject extrinsic instance.
   *
   * Description:
   * Someone can create project
   *
   * @param {*} param0 project info
   * @param {*} param0.name project name
   * @param {*} param0.logo project logo
   * @param {*} param0.description project description
   * @param {*} param0.website project website
   *
   */
  createProject({
    name, logo, description, website,
  }) {
    return this.createQuadraticFundingExtrinsic(ExtrinsicsTypes.createProject.method, name, logo, description, website);
  }

  /**
   * Create QuadraticFunding.fund extrinsic instance.
   *
   * Description:
   * Transfer fund to fund pool
   *
   * @param {*} param0 fund info
   * @param {*} param0.fundBalance fund balance
   *
   */
  fund({
    fundBalance,
  }) {
    return this.createQuadraticFundingExtrinsic(ExtrinsicsTypes.fund.method, fundBalance);
  }

  /**
   * Create QuadraticFunding.scheduleRound extrinsic instance
   *
   * Description:
   * The committee can schedule the next round
   *
   * @param {*} param0 round info
   * @param {*} param0.start round start block number
   * @param {*} param0.end round end block number
   * @param {*} param0.matchingFund round matching fund
   * @param {*} param0.projectIndexes project index list in this round
   *
   */
  scheduleRound({
    start, end, matchingFund, projectIndexes,
  }) {
    return this.createQuadraticFundingExtrinsicBySudo(ExtrinsicsTypes.scheduleRound.method, start, end, matchingFund, projectIndexes);
  }

  /**
   * Create QuadraticFunding.contribute extrinsic instance
   *
   * Description:
   * User can contribute the project in this active round
   *
   * @param {*} param0 contribute info
   * @param {*} param0.value contribute value
   * @param {*} param0.projectIndex contribute project index
   *
   */
  contribute({
    value, projectIndex,
  }) {
    return this.createQuadraticFundingExtrinsic(ExtrinsicsTypes.contribute.method, projectIndex, value);
  }

  /**
   * Create QuadraticFunding.finalizeRound extrinsic instance
   *
   * Description:
   * When the project is allowed withdraw, the project owner can withdraw the project fund
   *
   * @param {*} param0 finalize round info
   * @param {*} param0.roundIndex finalize round index
   *
   */
  finalizeRound({
    roundIndex,
  }) {
    return this.createQuadraticFundingExtrinsicBySudo(ExtrinsicsTypes.finalizeRound.method, roundIndex);
  }

  /**
   * Create QuadraticFunding.withdraw extrinsic instance
   *
   * Description:
   * When the project is allowed withdraw, the project owner can withdraw the project fund
   *
   * @param {*} param0 withdraw info
   * @param {*} param0.roundIndex withdraw round index
   * @param {*} param0.projectIndex withdraw project index
   *
   */
  withdraw({
    roundIndex, projectIndex,
  }) {
    return this.createQuadraticFundingExtrinsic(ExtrinsicsTypes.withdraw.method, roundIndex, projectIndex);
  }

  /**
   * Create QuadraticFunding.approve extrinsic instance
   *
   * Description:
   * Approve the project owner to withdraw the amount
   *
   * @param {*} param0
   * @param {*} param0.roundIndex approve round index
   * @param {*} param0.projectIndex approve project index
   *
   */
  approve({
    roundIndex, projectIndex,
  }) {
    return this.createQuadraticFundingExtrinsicBySudo(ExtrinsicsTypes.approve.method, roundIndex, projectIndex);
  }

  /**
   * Create QuadraticFunding.cancelRound extrinsic instance
   *
   * Description:
   * The committee can cancel the next schedule round
   *
   * @param {*} param0 cancel round info
   * @param {*} param0.roundIndex withdraw round index
   *
   */
  cancelRound({ roundIndex }) {
    return this.createQuadraticFundingExtrinsicBySudo(ExtrinsicsTypes.cancelRound.method, roundIndex);
  }

  /**
   * Create QuadraticFunding.cancel extrinsic instance
   *
   * Description:
   * The committee can cancel a specific project in this active round.
   * User cannot contribute a canceled project, and project owner cannot withdraw the canceled project fund
   *
   * @param {*} param0 cancel info
   * @param {*} param0.roundIndex withdraw round index
   * @param {*} param0.projectIndex withdraw project index
   *
   */
  cancel({ roundIndex, projectIndex }) {
    return this.createQuadraticFundingExtrinsicBySudo(ExtrinsicsTypes.cancel.method, roundIndex, projectIndex);
  }

  // Utils module

  /**
   * Filter QuadraticFunding's extrinsic's events with query method name, and return the response or error
   *
   * @param {*} events QuadraticFunding's extrinsic's events
   * @param {*} queryMethod Filter method name
   *
   */
  static getMethodResponseFromEvents(events, queryMethod) {
    let response = null;
    let error = null;
    let success = false;
    events.forEach(({ phase, event: { data, method, section } }) => {
      if (section.toString() === 'system' && method.toString() === 'ExtrinsicFailed') {
        error = new Error('ExtrinsicFailed');
      }
      if (section.toString() === 'system' && method.toString() === 'ExtrinsicSuccess') {
        success = true;
      }
      if (section.toString() === 'quadraticFunding' && method.toString() === queryMethod) {
        response = data;
      }
      if (section.toString() === 'sudo' && method.toString() === 'Sudid') {
        const sudoResult = data.toHuman();
        error = _.isEmpty(sudoResult[0].Err || sudoResult[0].err) ? null : (sudoResult[0].Err || sudoResult[0].err);
      }
    });
    return { response, error, success };
  }
}

module.exports = QuadraticFunding;
