const { assert } = require('chai');
const _ = require('lodash');
const BigNumber = require('bignumber.js');

const {
  initAccount, initApi,
  getCurrentBlockNumber, getProjectCount,
} = require('../utils');
const { scheduleRound } = require('./method');

describe('Method Test - schedule_round', async () => {
  before(async () => {
    await initAccount();
    await initApi();
  });

  beforeEach(async () => {
    const blockNumber = await getCurrentBlockNumber();
    global.blockNumber = blockNumber.toNumber();

    const projectCount = await getProjectCount();
    global.projectCount = projectCount.toNumber();
  });

  it('Success case', async () => {
    const params = {
      start: global.blockNumber + 100,
      end: global.blockNumber + 100000,
      matchingFund: 100,
      projectIndexes: [0],
    };

    let error = null;
    const roundInfo = await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    // assert.strictEqual(_.isMatch(roundInfo, params), true);
    assert.notEqual(roundInfo, null);
  });

  it('Success case with matchingFound = 0', async () => {
    const params = {
      start: global.blockNumber + 100,
      end: global.blockNumber + 100000,
      matchingFund: 0,
      projectIndexes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };

    let error = null;
    const roundInfo = await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    // assert.strictEqual(_.isMatch(roundInfo, params), true);
    assert.notEqual(roundInfo, null);
  });

  it('Error case with start > end', async () => {
    const params = {
      start: global.blockNumber + 10000,
      end: global.blockNumber + 100,
      matchingFund: 100,
      projectIndexes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with start/end/matchingFound < 0', async () => {
    const params = {
      start: -100,
      end: -1,
      matchingFund: -100,
      projectIndexes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with start/end = 0', async () => {
    const params = {
      start: 0,
      end: 0,
      matchingFund: 100,
      projectIndexes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with start/end < current blockNumber', async () => {
    const params = {
      start: global.blockNumber - 10000,
      end: global.blockNumber - 100,
      matchingFund: 100,
      projectIndexes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with invalid project index (invalid array index)', async () => {
    const params = {
      start: global.blockNumber + 100,
      end: global.blockNumber + 100000,
      matchingFund: 100,
      projectIndexes: [-1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with invalid project index (project index is not exsit in storage)', async () => {
    const overflowIndex = global.projectCount + 10;
    const params = {
      start: global.blockNumber + 100,
      end: global.blockNumber + 100000,
      matchingFund: 100,
      projectIndexes: [1, 2, 3, 4, 5, 6, 7, 8, 9, overflowIndex],
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with projectIndexed is empty', async () => {
    const params = {
      start: global.blockNumber + 100,
      end: global.blockNumber + 100000,
      matchingFund: 100,
      projectIndexes: [],
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  // // TODO: Need get per round max projects length (Storage has no such maxLength filed)
  // it('Error case with the length of projects > per round max projects length', async () => {
  //   const params = {
  //     start: global.blockNumber + 100,
  //     end: global.blockNumber + 100000,
  //     matchingFund: 100,
  //     projectIndexes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  //   };

  //   let error = null;
  //   await scheduleRound(params).catch((err) => {
  //     error = err.message;
  //   });
  //   assert.notEqual(error, null);
  // });

  it('Error case with value = null', async () => {
    const params = {
      start: null,
      end: null,
      matchingFund: null,
      projectIndexes: null,
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value type is string', async () => {
    const params = {
      start: `${global.blockNumber + 100}`,
      end: `${global.blockNumber + 100000}`,
      matchingFund: '100',
      projectIndexes: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10',
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value is empty string', async () => {
    const params = {
      start: '',
      end: '',
      matchingFund: '',
      projectIndexes: '',
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });

  it('Error case with value type is BigNumber', async () => {
    const params = {
      start: BigNumber(global.blockNumber + 100),
      end: BigNumber(global.blockNumber + 100000),
      matchingFund: BigNumber(100),
      projectIndexes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    };

    let error = null;
    await scheduleRound(params).catch((err) => {
      error = err.message;
    });
    assert.notEqual(error, null);
  });
});