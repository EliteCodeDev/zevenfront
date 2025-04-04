import React from 'react'
import { CreateStepFormC } from "@/components/forms/step/CreateStepForm";
import DashboardLayout from "../../";
// import { Toaster, toast } from 'sonner';
export default function Index() {
  return (
    <DashboardLayout>
      <CreateStepFormC />
    </DashboardLayout>
  )
}
