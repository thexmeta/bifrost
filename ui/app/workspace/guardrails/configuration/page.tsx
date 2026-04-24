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
import { SearchCheck } from "lucide-react";

import GuardrailsConfigurationView from "@enterprise/components/guardrails/guardrailsConfigurationView";

// export default function GuardrailsConfigurationPage() {
// 	return (
// 		<div className="mx-auto w-full max-w-7xl">
// 			<GuardrailsConfigurationView />
// 		</div>
// 	);
// }

export default function GuardrailsConfigurationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guardrails Configuration</h1>
        <p className="text-muted-foreground">Configure guardrails rules</p>
      </div>

      <Alert>
        <SearchCheck className="h-4 w-4" />
        <AlertDescription>
          Configure guardrails rules to define content safety policies that will
          be applied to AI requests and responses.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Guardrails Rules</CardTitle>
          <CardDescription>
            Manage guardrails configuration rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <SearchCheck className="mb-4 h-16 w-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              No Configuration Rules Yet
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first guardrails configuration rule to define content
              safety policies
            </p>
            <Button>Create Configuration Rule</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
