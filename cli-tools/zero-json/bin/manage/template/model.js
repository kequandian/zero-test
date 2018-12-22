import { baseModel, modelExtend, requestSet } from 'zero-element';
const { query, post, update, remove } = requestSet;

export default modelExtend(baseModel, {
  namespace: 'ZERO_pageName',
  state: {},
  reducers: {
  },
  effects: {
    *demo({ payload }, { call, put, select }) {
      console.log("demo");
      const { API, ...restPayload } = payload;
      const result = yield call(query, '/api/test', restPayload);
      if( result.code === 200 ){
        yield put({
          type: 'save',
          payload: {
            demo: {
              ...rest,
              data: result.data,
            },
          }
        })
      }
      return true;
    }
  }
});