import React, { PureComponent } from 'react';
import { connect } from 'dva';
import { ZEle } from 'zero-element';
import config from './config/ZERO_childName';

@connect(({ ZERO_parentName, loading }) => ({
  modelStatus: ZERO_parentName,
  namespace: 'ZERO_parentName',
  loading: loading.effects,
}))
export default class ZERO_childNameUpperCase extends PureComponent {
  render() {
    return (
      <ZEle { ...this.props } config={ config }/>
    );
  }
}