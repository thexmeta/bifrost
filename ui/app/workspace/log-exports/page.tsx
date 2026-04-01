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
import { CloudDownload, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const logExportsFormSchema = z.object({
	enabled: z.boolean(),
	bucket: z.string().min(1, "Bucket name is required"),
	region: z.string().min(1, "Region is required"),
	prefix: z.string(),
	format: z.enum(["json", "csv"]),
	compression: z.enum(["gzip", "none"]),
	interval_hours: z.number().min(1).max(24),
});

type LogExportsFormValues = z.infer<typeof logExportsFormSchema>;

export default function LogExportsPage() {
	const { data: config, isLoading } = useGetCoreConfigQuery({});
	const [updateConfig, { isLoading: isUpdating }] = useUpdateCoreConfigMutation();

	const enterpriseConfig = config?.enterprise || {};
	const logExportsConfig = enterpriseConfig.log_exports || {};
	const destinationConfig = logExportsConfig.destination?.config || {};
	const scheduleConfig = logExportsConfig.schedule || {};

	const defaultValues: LogExportsFormValues = {
		enabled: logExportsConfig.enabled ?? false,
		bucket: destinationConfig.bucket ?? "",
		region: destinationConfig.region ?? "us-east-1",
		prefix: destinationConfig.prefix ?? "bifrost-logs/",
		format: destinationConfig.format ?? "json",
		compression: destinationConfig.compression ?? "gzip",
		interval_hours: scheduleConfig.interval_hours ?? 1,
	};

	const form = useForm<LogExportsFormValues>({
		resolver: zodResolver(logExportsFormSchema),
		defaultValues,
	});

	const onSubmit = async (data: LogExportsFormValues) => {
		try {
			await updateConfig({
				...config,
				enterprise: {
					...config?.enterprise,
					log_exports: {
						enabled: data.enabled,
						destination: {
							type: "s3",
							config: {
								bucket: data.bucket,
								region: data.region,
								prefix: data.prefix,
								format: data.format,
								compression: data.compression,
							},
						},
						schedule: {
							interval_hours: data.interval_hours,
						},
					},
				},
			} as any).unwrap();
			toast.success("Log exports configuration updated successfully");
		} catch (error) {
			toast.error("Failed to update log exports configuration", {
				description: getErrorMessage(error),
			});
		}
	};

	const storageTypes = [
		{ value: "s3", label: "Amazon S3" },
		{ value: "gcs", label: "Google Cloud Storage" },
		{ value: "azure_blob", label: "Azure Blob Storage" },
	];

	const formats = [
		{ value: "json", label: "JSON" },
		{ value: "csv", label: "CSV" },
	];

	const compressions = [
		{ value: "gzip", label: "GZIP" },
		{ value: "none", label: "None" },
	];

	const awsRegions = [
		{ value: "us-east-1", label: "US East (N. Virginia)" },
		{ value: "us-east-2", label: "US East (Ohio)" },
		{ value: "us-west-1", label: "US West (N. California)" },
		{ value: "us-west-2", label: "US West (Oregon)" },
		{ value: "eu-west-1", label: "EU (Ireland)" },
		{ value: "eu-west-2", label: "EU (London)" },
		{ value: "eu-central-1", label: "EU (Frankfurt)" },
		{ value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
		{ value: "ap-southeast-2", label: "Asia Pacific (Sydney)" },
		{ value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
	];

	if (isLoading) {
		return <div className="flex h-64 items-center justify-center">Loading...</div>;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Log Exports</h1>
				<p className="text-muted-foreground">Configure automated export of request logs to cloud storage</p>
			</div>

			<Alert>
				<CloudDownload className="h-4 w-4" />
				<AlertDescription>
					Automatically export Bifrost request logs to your cloud storage bucket for long-term retention, compliance, and
					analysis.
				</AlertDescription>
			</Alert>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>S3 Export Configuration</CardTitle>
							<CardDescription>Configure Amazon S3 as the destination for log exports</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="enabled"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Enable Log Exports</FormLabel>
											<FormDescription>Automatically export logs to S3</FormDescription>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="bucket"
								render={({ field }) => (
									<FormItem>
										<FormLabel>S3 Bucket Name</FormLabel>
										<FormControl>
											<Input placeholder="my-bifrost-logs-bucket" {...field} value={field.value ?? ""} />
										</FormControl>
										<FormDescription>Name of the S3 bucket to export logs to</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="region"
								render={({ field }) => (
									<FormItem>
										<FormLabel>AWS Region</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select AWS region" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{awsRegions.map((region) => (
													<SelectItem key={region.value} value={region.value}>
														{region.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>Region where your S3 bucket is located</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="prefix"
								render={({ field }) => (
									<FormItem>
										<FormLabel>S3 Prefix (Optional)</FormLabel>
										<FormControl>
											<Input placeholder="bifrost-logs/" {...field} value={field.value ?? ""} />
										</FormControl>
										<FormDescription>Path prefix for exported logs (e.g., bifrost-logs/)</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="format"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Export Format</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select format" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{formats.map((format) => (
														<SelectItem key={format.value} value={format.value}>
															{format.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>Format for exported log files</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="compression"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Compression</FormLabel>
											<Select onValueChange={field.onChange} defaultValue={field.value}>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Select compression" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{compressions.map((compression) => (
														<SelectItem key={compression.value} value={compression.value}>
															{compression.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormDescription>Compression type for exported files</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								control={form.control}
								name="interval_hours"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Export Interval (hours)</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={1}
												max={24}
												placeholder="1"
												{...field}
												onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
												value={field.value ?? 1}
											/>
										</FormControl>
										<FormDescription>How often to export logs (1-24 hours)</FormDescription>
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
					<CardTitle>Export Schedule</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">
						Logs are exported automatically based on the configured interval. Each export creates a new file with a timestamp
						in the filename.
					</p>
					<div className="mt-4 rounded-md bg-muted p-4">
						<p className="text-sm font-mono">
							s3://{form.getValues("bucket")}/{form.getValues("prefix")}
							{form.getValues("format")}-{new Date().toISOString().split("T")[0]}-*.
							{form.getValues("compression") === "gzip" ? "json.gz" : form.getValues("format")}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
