import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'sonner';

export default function RedirectAndLog() {
  const router = useRouter();
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      toast.success('Cuenta activada exitosamente.');
      router.replace('/login');
    }
  }, []);

  return (
    <>
    </>
  );
};
