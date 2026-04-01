"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookUser } from "lucide-react";

export default function SCIMPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">User Provisioning (SCIM)</h1>
				<p className="text-muted-foreground">Configure SCIM-based user provisioning</p>
			</div>

			<Alert>
				<BookUser className="h-4 w-4" />
				<AlertDescription>
					SCIM (System for Cross-domain Identity Management) enables automated user provisioning and deprovisioning
					from your identity provider.
				</AlertDescription>
			</Alert>

			<Card>
				<CardHeader>
					<CardTitle>SCIM Configuration</CardTitle>
					<CardDescription>Manage user provisioning settings</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<BookUser className="mb-4 h-16 w-16 text-muted-foreground" />
						<h3 className="text-lg font-semibold">SCIM Not Configured</h3>
						<p className="mb-4 text-sm text-muted-foreground">
							Configure SCIM to enable automated user provisioning from your identity provider
						</p>
						<Button>Configure SCIM</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
