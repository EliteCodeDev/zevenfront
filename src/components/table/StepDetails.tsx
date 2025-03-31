"use client";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { UpdateStepFormC } from "@/components/forms/step/UpdateStepFormC";

export interface Subcategory {
  id: string | number;
  name: string;
}

export interface Stage {
  id: string | number;
  name: string;
}

export interface Step {
  name: string;
  subcategories: Subcategory[];
  stages: Stage[];
}

interface StepDetailsProps {
  step: Step;
  data: any;
}

export function StepDetails({ step, data }: StepDetailsProps) {
  // console.log(data);
  const [newData, setnewData] = useState(null);
  const handleEditing = (data) => {
    setnewData(data);
  };
  return (
    <Card className="border-0">
      <CardContent className="">
        <UpdateStepFormC step={data} onStepChange={handleEditing} />
      </CardContent>
    </Card>
  );
}
