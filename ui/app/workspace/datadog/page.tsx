"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useGetCoreConfigQuery, useUpdateCoreConfigMutation } from "@/lib/store";
import { getErrorMessage } from "@/lib/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart3, Info } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const datadogFormSchema = z.object({
	enabled: z.boolean(),
	api_key: z.string().min(1, "API key is required"),
	app_key: z.string().optional(),
	site: z.enum(["datadoghq.com", "datadoghq.eu", "ddog-gov.com", "ap1.datadoghq.com"]),
	send_traces: z.boolean(),
	send_metrics: z.boolean(),
	send_logs: z.boolean(),
});

type DatadogFormValues = z.infer<typeof datadogFormSchema>;

export default function DatadogConfigurationPage() {
	const { data: config, isLoading } = useGetCoreConfigQuery({ fromDB: true });
	const [updateConfig, { isLoading: isUpdating }] = useUpdateCoreConfigMutation();

	const datadogConfig = config?.enterprise?.datadog || {};

	const form = useForm<DatadogFormValues>({
		resolver: zodResolver(datadogFormSchema),
		defaultValues: {
			enabled: datadogConfig.enabled ?? false,
			api_key: datadogConfig.api_key ?? "",
			app_key: datadogConfig.app_key ?? "",
			site: datadogConfig.site ?? "datadoghq.com",
			send_traces: datadogConfig.send_traces ?? true,
			send_metrics: datadogConfig.send_metrics ?? true,
			send_logs: datadogConfig.send_logs ?? false,
		},
	});

	useEffect(() => {
		if (datadogConfig) {
			form.reset({
				enabled: datadogConfig.enabled ?? false,
				api_key: datadogConfig.api_key ?? "",
				app_key: datadogConfig.app_key ?? "",
				site: datadogConfig.site ?? "datadoghq.com",
				send_traces: datadogConfig.send_traces ?? true,
				send_metrics: datadogConfig.send_metrics ?? true,
				send_logs: datadogConfig.send_logs ?? false,
			});
		}
	}, [datadogConfig, form]);

	const onSubmit = async (data: DatadogFormValues) => {
		try {
			await updateConfig({
				...config,
				enterprise: {
					...config?.enterprise,
					datadog: {
						enabled: data.enabled,
						api_key: data.api_key,
						app_key: data.app_key,
						site: data.site,
						send_traces: data.send_traces,
						send_metrics: data.send_metrics,
						send_logs: data.send_logs,
					},
				},
			} as any).unwrap();
			toast.success("Datadog configuration updated successfully");
		} catch (error) {
			toast.error("Failed to update Datadog configuration", {
				description: getErrorMessage(error),
			});
		}
	};

	const datadogSites = [
		{ value: "datadoghq.com", label: "US1 (datadoghq.com)" },
		{ value: "datadoghq.eu", label: "EU (datadoghq.eu)" },
		{ value: "ddog-gov.com", label: "US Gov (ddog-gov.com)" },
		{ value: "ap1.datadoghq.com", label: "AP1 (ap1.datadoghq.com)" },
	];

	if (isLoading) {
		return <div className="flex h-64 items-center justify-center">Loading...</div>;
	}

	return (
		<div className="space-y-6" data-testid="datadog-page">
			<div>
				<h1 className="text-2xl font-bold">Datadog Integration</h1>
				<p className="text-muted-foreground">Configure observability integration for traces, metrics, and logs</p>
			</div>

			<Alert>
				<BarChart3 className="h-4 w-4" />
				<AlertDescription>
					Send Bifrost traces, metrics, and logs to Datadog for centralized observability and monitoring.
					Configure your Datadog API key to enable real-time performance dashboards and alerting.
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
											<FormDescription>Send observability data to Datadog</FormDescription>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} data-testid="datadog-enabled-toggle" />
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
												<SelectTrigger data-testid="datadog-site-select">
													<SelectValue placeholder="Select Datadog site" />
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
										<FormDescription>Select your Datadog site region</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="api_key"
								render={({ field }) => (
									<FormItem>
										<FormLabel>API Key</FormLabel>
										<FormControl>
											<Input type="password" placeholder="Enter your Datadog API key" {...field} value={field.value ?? ""} data-testid="datadog-api-key-input" />
										</FormControl>
										<FormDescription>Your Datadog API key for authentication</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="app_key"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Application Key (Optional)</FormLabel>
										<FormControl>
											<Input type="password" placeholder="Enter your Datadog application key" {...field} value={field.value ?? ""} data-testid="datadog-app-key-input" />
										</FormControl>
										<FormDescription>Required for some Datadog features like dashboard management</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="space-y-4">
								<FormLabel>Data to Send</FormLabel>

								<FormField
									control={form.control}
									name="send_traces"
									render={({ field }) => (
										<FormItem className="flex items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel>Traces</FormLabel>
												<FormDescription>Send request traces for distributed tracing</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} data-testid="datadog-traces-toggle" />
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="send_metrics"
									render={({ field }) => (
										<FormItem className="flex items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel>Metrics</FormLabel>
												<FormDescription>Send performance metrics for monitoring</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} data-testid="datadog-metrics-toggle" />
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="send_logs"
									render={({ field }) => (
										<FormItem className="flex items-center justify-between rounded-lg border p-4">
											<div className="space-y-0.5">
												<FormLabel>Logs</FormLabel>
												<FormDescription>Send request logs for log management</FormDescription>
											</div>
											<FormControl>
												<Switch checked={field.value} onCheckedChange={field.onChange} data-testid="datadog-logs-toggle" />
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
							onClick={() => form.reset()}
							disabled={isUpdating || !form.formState.isDirty}
							data-testid="datadog-reset-button"
						>
							Reset
						</Button>
						<Button type="submit" disabled={isUpdating || !form.formState.isDirty} data-testid="datadog-save-button">
							{isUpdating ? "Saving..." : "Save Configuration"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
