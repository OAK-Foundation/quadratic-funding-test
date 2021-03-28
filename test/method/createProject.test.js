const { assert } = require('chai');
const _ = require('lodash');

const {
  initAccount, initApi,
} = require('../utils');
const { createProject } = require('./method');

describe('Method Test - create_project', async () => {
  before(async () => {
    await initAccount();
    await initApi();
  });
  it('Success case', async () => {
    const params = {
      name: 'name',
      logo: 'https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
      description: 'description',
      website: 'https://oak.tech/',
    };
    let error = null;
    const projectInfo = await createProject(params).catch((err) => {
      error = err.message;
    });
    assert.strictEqual(error, null);
    assert.strictEqual(_.isMatch(projectInfo, params), true);
  });

  // it('Success case with value has some specific symbols', async () => {
  //   const params = {
  //     name: '\\_?*&^%$#@~!@name',
  //     logo: '\\_?*&^%$#@~!https://oak.tech/_next/static/images/logo-e546db00eb163fae7f0c56424c3a2586.png',
  //     description: '\\_?*&^%$#@~!description',
  //     website: '\\_?*&^%$#@~!https://oak.tech/',
  //   };
  //   let error = null;
  //   const projectInfo = await createProject(params).catch((err) => {
  //     error = err.message;
  //   });
  //   assert.strictEqual(error, null);
  //   assert.strictEqual(_.isMatch(projectInfo, params), true);
  // });

  // it('Error case with value type is number', async () => {
  //   const params = {
  //     name: 123,
  //     logo: 123,
  //     description: 123,
  //     website: 123,
  //   };
  //   let error = null;
  //   await createProject(params).catch((err) => {
  //     error = err.message;
  //   });
  //   assert.notEqual(error, null);
  // });

  // it('Error case with value is null', async () => {
  //   const params = {
  //     name: null,
  //     logo: null,
  //     description: null,
  //     website: null,
  //   };
  //   let error = null;
  //   await createProject(params).catch((err) => {
  //     error = err.message;
  //   });
  //   assert.notEqual(error, null);
  // });

  // it('Error case with value is empty string', async () => {
  //   const params = {
  //     name: '',
  //     logo: '',
  //     description: '',
  //     website: '',
  //   };
  //   let error = null;
  //   await createProject(params).catch((err) => {
  //     error = err.message;
  //   });
  //   assert.notEqual(error, null);
  // });

  // it('Error case with value is empty array', async () => {
  //   const params = {
  //     name: [],
  //     logo: [],
  //     description: [],
  //     website: [],
  //   };
  //   let error = null;
  //   await createProject(params).catch((err) => {
  //     error = err.message;
  //   });
  //   assert.notEqual(error, null);
  // });

  // it('Error case with value is empty object', async () => {
  //   const params = {
  //     name: {},
  //     logo: {},
  //     description: {},
  //     website: {},
  //   };
  //   let error = null;
  //   await createProject(params).catch((err) => {
  //     error = err.message;
  //   });
  //   assert.notEqual(error, null);
  // });
});