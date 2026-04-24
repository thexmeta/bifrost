"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Router } from "lucide-react";

export default function PromptDeploymentsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Prompt Deployments</h1>
				<p className="text-muted-foreground">Manage prompt deployment strategies</p>
			</div>

			<Alert>
				<Router className="h-4 w-4" />
				<AlertDescription>
					Deploy prompts with different strategies including canary deployments,
					A/B testing, and gradual rollouts to manage prompt versions in production.
				</AlertDescription>
			</Alert>

			<Card>
				<CardHeader>
					<CardTitle>Deployments</CardTitle>
					<CardDescription>Manage prompt deployment strategies</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<Router className="mb-4 h-16 w-16 text-muted-foreground" />
						<h3 className="text-lg font-semibold">No Deployments Yet</h3>
						<p className="mb-4 text-sm text-muted-foreground">
							Create your first prompt deployment to manage prompt versions in production
						</p>
						<Button>Create Deployment</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
