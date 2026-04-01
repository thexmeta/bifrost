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
import { Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const datadogFormSchema = z.object({
	enabled: z.boolean(),
	api_key: z.string().optional(),
	app_key: z.string().optional(),
	site: z.string(),
	traces_enabled: z.boolean(),
	metrics_enabled: z.boolean(),
	logs_enabled: z.boolean(),
});

type DatadogFormValues = z.infer<typeof datadogFormSchema>;

export default function DatadogConnectorPage() {
	const { data: pluginData, isLoading } = useGetPluginQuery("datadog");
	const [updatePlugin, { isLoading: isUpdating }] = useUpdatePluginMutation();

	const defaultValues: DatadogFormValues = {
		enabled: pluginData?.config?.enabled ?? false,
		api_key: pluginData?.config?.api_key ?? "",
		app_key: pluginData?.config?.app_key ?? "",
		site: pluginData?.config?.site ?? "datadoghq.com",
		traces_enabled: pluginData?.config?.traces_enabled ?? true,
		metrics_enabled: pluginData?.config?.metrics_enabled ?? true,
		logs_enabled: pluginData?.config?.logs_enabled ?? false,
	};

	const form = useForm<DatadogFormValues>({
		resolver: zodResolver(datadogFormSchema),
		defaultValues,
	});

	const onSubmit = async (data: DatadogFormValues) => {
		try {
			await updatePlugin({
				name: "datadog",
				data: {
					enabled: data.enabled,
					config: {
						api_key: data.api_key,
						app_key: data.app_key,
						site: data.site,
						traces_enabled: data.traces_enabled,
						metrics_enabled: data.metrics_enabled,
						logs_enabled: data.logs_enabled,
					},
				},
			}).unwrap();
			toast.success("Datadog configuration updated successfully");
		} catch (error) {
			toast.error("Failed to update Datadog configuration", {
				description: getErrorMessage(error),
			});
		}
	};

	const datadogSites = [
		{ value: "datadoghq.com", label: "US (datadoghq.com)" },
		{ value: "datadoghq.eu", label: "EU (datadoghq.eu)" },
		{ value: "us3.datadoghq.com", label: "US3 (us3.datadoghq.com)" },
		{ value: "us5.datadoghq.com", label: "US5 (us5.datadoghq.com)" },
		{ value: "ap1.datadoghq.com", label: "AP1 (ap1.datadoghq.com)" },
	];

	if (isLoading) {
		return <div className="flex h-64 items-center justify-center">Loading...</div>;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Datadog Integration</h1>
				<p className="text-muted-foreground">Configure Datadog integration for APM traces, metrics, and logs</p>
			</div>

			<Alert>
				<Info className="h-4 w-4" />
				<AlertDescription>
					Datadog integration enables automatic export of traces, metrics, and logs to your Datadog dashboard for comprehensive
					observability.
				</AlertDescription>
			</Alert>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Datadog Configuration</CardTitle>
							<CardDescription>Connect Bifrost to your Datadog account</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="enabled"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Enable Datadog Integration</FormLabel>
											<FormDescription>Export traces, metrics, and logs to Datadog</FormDescription>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="site"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Datadog Site</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select your Datadog site" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{datadogSites.map((site) => (
													<SelectItem key={site.value} value={site.value}>
														{site.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>Select the Datadog site for your account</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="api_key"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Datadog API Key</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="Enter your Datadog API key"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											Find your API key in Datadog under Organization Settings → API Keys
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="app_key"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Datadog Application Key</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="Enter your Datadog Application key"
												{...field}
												value={field.value ?? ""}
											/>
										</FormControl>
										<FormDescription>
											Find your Application key in Datadog under Organization Settings → API Keys
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="space-y-4 border-t pt-4">
								<h3 className="text-lg font-medium">Export Settings</h3>

								<FormField
									control={form.control}
									name="traces_enabled"
									render={({ field }) => (
										<FormItem className="flex items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel className="text-base">Export Traces</FormLabel>
												<FormDescription>Export APM traces for distributed tracing</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="metrics_enabled"
									render={({ field }) => (
										<FormItem className="flex items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel className="text-base">Export Metrics</FormLabel>
												<FormDescription>Export custom metrics to Datadog</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="logs_enabled"
									render={({ field }) => (
										<FormItem className="flex items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel className="text-base">Export Logs</FormLabel>
												<FormDescription>Export request logs to Datadog Logs</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} />
											</FormControl>
										</FormItem>
									)}
								/>
							</div>
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
		</div>
	);
}
