/* eslint-disable react/react-in-jsx-scope */
/**
 * Asynchronously loads the component for NotFoundPage
 */
import React from 'react';
import Loadable from 'react-loadable';
import Loader from '../../../../components/Loader';

export default Loadable({
  loader: () => import(/* webpackChunkName: "invoicesVerify" */ './index'),
  loading: () => <Loader />,
});
