import React from 'react';
import { useRouter } from "next/router";
import { UpdateStepFormC } from "@/components/forms/step/UpdateStepFormC";
import DashboardLayout from "../../";
import { useStrapiData } from "../../../../services/strapiServiceId";
import { StepLoader } from '..';
import Error404 from '../../../404'; // Importamos el componente Error de Next.js

export default function UpdateStep() {
  const router = useRouter();
  const { documentid } = router.query;

  // Llamamos al hook solo si documentid está disponible 
  const { data, error, isLoading, refetch } = useStrapiData(
    documentid ? `challenge-steps/${documentid}/get-all-data` : null
  );


  // Si no hay data relacionada al documentId, tirar a la pagina 404  
  // Agregamos esta verificación una vez que la carga ha terminado
  if (!isLoading && !error && (!data || !data.data || data.data.length === 0)) {
    return <Error404 />;
    // Alternativa: router.push('/404');
  }

  // Callback que se pasa al formulario para refrescar la data 
  const handleActive = () => {
    // console.log("active");
    refetch(); // Vuelve a ejecutar la consulta 
  };

  // Mientras no se tenga documentid o se esté cargando, mostramos un loader 
  if (!documentid || isLoading) {
    return (
      <DashboardLayout>
        <StepLoader />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className='grid place-items-center h-screen'>
          Error: <p className='text-red-500'>{error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  // En Strapi v4, el registro único suele estar en data[0] si la respuesta es un arreglo 
  return (
    <DashboardLayout>
      <UpdateStepFormC step={data.data[0]} onStepChange={handleActive} />
    </DashboardLayout>
  );
}