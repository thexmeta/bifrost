"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Construction } from "lucide-react";
import GuardrailsConfigurationView from "@enterprise/components/guardrails/guardrailsConfigurationView";

// export default function GuardrailsPage() {
// 	return (
// 		<div className="mx-auto w-full max-w-7xl">
// 			<GuardrailsConfigurationView />
// 		</div>
// 	);
// }

export default function GuardrailsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guardrails</h1>
        <p className="text-muted-foreground">
          Configure content safety guardrails
        </p>
      </div>

      <Alert>
        <Construction className="h-4 w-4" />
        <AlertDescription>
          Guardrails provide content safety enforcement using AWS Bedrock
          Guardrails, Azure Content Safety, or Patronus AI for real-time content
          moderation.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Guardrail Rules</CardTitle>
          <CardDescription>Manage content safety rules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Construction className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Guardrail Rules Yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first guardrail rule to enforce content safety
              policies
            </p>
            <Button>Create Guardrail Rule</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
