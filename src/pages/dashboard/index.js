/* src/pages/dashboard/index.js*/
import Layout from '../../components/layout/dashboard';

import UserPanel from './UserPanel';
import React from 'react';

export default function Index() {

  return (
    <Layout>
        <UserPanel />
    </Layout>
  );
};