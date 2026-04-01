"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes } from "lucide-react";

export default function GuardrailsProvidersPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Guardrails Providers</h1>
				<p className="text-muted-foreground">Configure guardrails providers</p>
			</div>

			<Alert>
				<Boxes className="h-4 w-4" />
				<AlertDescription>
					Configure guardrails providers like AWS Bedrock Guardrails, Azure Content Safety,
					or Patronus AI to enforce content safety policies.
				</AlertDescription>
			</Alert>

			<Card>
				<CardHeader>
					<CardTitle>Providers</CardTitle>
					<CardDescription>Manage guardrails provider configurations</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<Boxes className="mb-4 h-16 w-16 text-muted-foreground" />
						<h3 className="text-lg font-semibold">No Providers Configured</h3>
						<p className="mb-4 text-sm text-muted-foreground">
							Add your first guardrails provider to start enforcing content safety policies
						</p>
						<Button>Add Provider</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}