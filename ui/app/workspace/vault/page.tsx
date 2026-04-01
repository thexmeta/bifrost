"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useGetPluginQuery, useUpdatePluginMutation } from "@/lib/store";
import { getErrorMessage } from "@/lib/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Vault } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const vaultFormSchema = z.object({
	enabled: z.boolean(),
	type: z.enum(["hashicorp", "aws", "google", "azure"]),
	address: z.string().optional(),
	token: z.string().optional(),
	sync_paths: z.string().optional(),
	sync_interval_seconds: z.number().min(60).max(3600),
});

type VaultFormValues = z.infer<typeof vaultFormSchema>;

export default function VaultConfigurationPage() {
	const { data: pluginData, isLoading } = useGetPluginQuery("vault");
	const [updatePlugin, { isLoading: isUpdating }] = useUpdatePluginMutation();

	const defaultValues: VaultFormValues = {
		enabled: pluginData?.config?.enabled ?? false,
		type: pluginData?.config?.type ?? "hashicorp",
		address: pluginData?.config?.address ?? "",
		token: pluginData?.config?.token ?? "",
		sync_paths: pluginData?.config?.sync_paths?.join(", ") ?? "bifrost/*",
		sync_interval_seconds: pluginData?.config?.sync_interval_seconds ?? 300,
	};

	const form = useForm<VaultFormValues>({
		resolver: zodResolver(vaultFormSchema),
		defaultValues,
	});

	const onSubmit = async (data: VaultFormValues) => {
		try {
			await updatePlugin({
				name: "vault",
				data: {
					enabled: data.enabled,
					config: {
						type: data.type,
						address: data.address,
						token: data.token,
						sync_paths: data.sync_paths?.split(",").map((s) => s.trim()).filter(Boolean),
						sync_interval_seconds: data.sync_interval_seconds,
					},
				},
			}).unwrap();
			toast.success("Vault configuration updated successfully");
		} catch (error) {
			toast.error("Failed to update Vault configuration", {
				description: getErrorMessage(error),
			});
		}
	};

	const vaultTypes = [
		{ value: "hashicorp", label: "HashiCorp Vault" },
		{ value: "aws", label: "AWS Secrets Manager" },
		{ value: "google", label: "Google Secret Manager" },
		{ value: "azure", label: "Azure Key Vault" },
	];

	if (isLoading) {
		return <div className="flex h-64 items-center justify-center">Loading...</div>;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Vault Integration</h1>
				<p className="text-muted-foreground">Configure secret management integration for secure API key storage</p>
			</div>

			<Alert>
				<Info className="h-4 w-4" />
				<AlertDescription>
					Vault integration enables automatic synchronization of API keys and virtual keys from your secret management system.
					Supports HashiCorp Vault, AWS Secrets Manager, Google Secret Manager, and Azure Key Vault.
				</AlertDescription>
			</Alert>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Vault className="h-5 w-5" />
								Vault Configuration
							</CardTitle>
							<CardDescription>Connect Bifrost to your secret management system</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="enabled"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Enable Vault Integration</FormLabel>
											<FormDescription>Synchronize secrets from your vault</FormDescription>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Vault Provider</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select vault provider" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{vaultTypes.map((type) => (
													<SelectItem key={type.value} value={type.value}>
														{type.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>Select your secret management provider</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="address"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Vault Address</FormLabel>
										<FormControl>
											<Input placeholder="https://vault.example.com" {...field} value={field.value ?? ""} />
										</FormControl>
										<FormDescription>URL of your Vault server (for HashiCorp Vault)</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="token"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Vault Token</FormLabel>
										<FormControl>
											<Input type="password" placeholder="Enter vault token" {...field} value={field.value ?? ""} />
										</FormControl>
										<FormDescription>Authentication token for Vault access</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="sync_paths"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sync Paths</FormLabel>
										<FormControl>
											<Input placeholder="bifrost/*" {...field} value={field.value ?? ""} />
										</FormControl>
										<FormDescription>Comma-separated list of vault paths to sync (e.g., bifrost/*, api-keys/*)</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="sync_interval_seconds"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sync Interval (seconds)</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={60}
												max={3600}
												placeholder="300"
												{...field}
												onChange={(e) => field.onChange(parseInt(e.target.value) || 300)}
												value={field.value ?? 300}
											/>
										</FormControl>
										<FormDescription>How often to sync secrets from vault (60-3600 seconds)</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => form.reset(defaultValues)}
							disabled={isUpdating || !form.formState.isDirty}
						>
							Reset
						</Button>
						<Button type="submit" disabled={isUpdating || !form.formState.isDirty}>
							{isUpdating ? "Saving..." : "Save Configuration"}
						</Button>
					</div>
				</form>
			</Form>

			<Card>
				<CardHeader>
					<CardTitle>Supported Vault Providers</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<h4 className="font-medium">HashiCorp Vault</h4>
							<p className="text-sm text-muted-foreground">Self-hosted or HCP Vault with full feature support</p>
						</div>
						<div className="space-y-2">
							<h4 className="font-medium">AWS Secrets Manager</h4>
							<p className="text-sm text-muted-foreground">Native AWS secret management with IAM authentication</p>
						</div>
						<div className="space-y-2">
							<h4 className="font-medium">Google Secret Manager</h4>
							<p className="text-sm text-muted-foreground">GCP secret management with service account auth</p>
						</div>
						<div className="space-y-2">
							<h4 className="font-medium">Azure Key Vault</h4>
							<p className="text-sm text-muted-foreground">Azure Key Vault with managed identity support</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
