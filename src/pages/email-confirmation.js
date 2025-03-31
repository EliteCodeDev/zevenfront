import Layout from '../components/layout/auth';
import { getSession } from 'next-auth/react';

import { CheckCircleIcon } from '@heroicons/react/20/solid';


export default function EmailConfirm() {
  return (
    <Layout >
      <div className="rounded-lg max-w-md w-full text-left mt-8 flex items-start">
        <CheckCircleIcon className="w-16 text-green-600 dark:text-green-400 mr-4" />
        <div>
          <p className="text-base font-semibold tracking-tight text-black dark:text-gray-100">
            Te has registrado correctamente.
          </p>
          <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión en el panel de control de <span className="font-semibold text-black dark:text-white">{process.env.NEXT_PUBLIC_NAME_APP}</span>.
          </p>
        </div>
      </div>


    </Layout>

  );
};

export const getServerSideProps = async (context) => {
  const session = await getSession(context);
  // Check if session exists or not, if not, redirect
  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
  return {
    props: {},
  };
};