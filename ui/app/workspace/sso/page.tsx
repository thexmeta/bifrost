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
import { Info, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const ssoFormSchema = z.object({
	enabled: z.boolean(),
	provider: z.enum(["okta", "entra"]),
	issuer: z.string().url().optional().or(z.literal("")),
	client_id: z.string().optional(),
	client_secret: z.string().optional(),
	redirect_uri: z.string().url(),
	scopes: z.string(),
	user_id_claim: z.string(),
	email_claim: z.string(),
	name_claim: z.string(),
	groups_claim: z.string(),
});

type SSOFormValues = z.infer<typeof ssoFormSchema>;

export default function SSOConfigurationPage() {
	const { data: config, isLoading } = useGetCoreConfigQuery({});
	const [updateConfig, { isLoading: isUpdating }] = useUpdateCoreConfigMutation();

	const enterpriseConfig = config?.enterprise || {};
	const ssoConfig = enterpriseConfig.sso || {};

	const defaultValues: SSOFormValues = {
		enabled: ssoConfig.enabled ?? false,
		provider: ssoConfig.provider ?? "okta",
		issuer: ssoConfig.issuer ?? "",
		client_id: ssoConfig.client_id ?? "",
		client_secret: ssoConfig.client_secret ?? "",
		redirect_uri: ssoConfig.redirect_uri ?? `${typeof window !== "undefined" ? window.location.origin : "http://localhost:8080"}/auth/callback`,
		scopes: ssoConfig.scopes?.join(" ") ?? "openid email profile",
		user_id_claim: ssoConfig.user_id_claim ?? "sub",
		email_claim: ssoConfig.email_claim ?? "email",
		name_claim: ssoConfig.name_claim ?? "name",
		groups_claim: ssoConfig.groups_claim ?? "groups",
	};

	const form = useForm<SSOFormValues>({
		resolver: zodResolver(ssoFormSchema),
		defaultValues,
	});

	const onSubmit = async (data: SSOFormValues) => {
		try {
			await updateConfig({
				...config,
				enterprise: {
					...config?.enterprise,
					sso: {
						enabled: data.enabled,
						provider: data.provider,
						issuer: data.issuer,
						client_id: data.client_id,
						client_secret: data.client_secret,
						redirect_uri: data.redirect_uri,
						scopes: data.scopes.split(" ").filter(Boolean),
						user_id_claim: data.user_id_claim,
						email_claim: data.email_claim,
						name_claim: data.name_claim,
						groups_claim: data.groups_claim,
					},
				},
			} as any).unwrap();
			toast.success("SSO configuration updated successfully");
		} catch (error) {
			toast.error("Failed to update SSO configuration", {
				description: getErrorMessage(error),
			});
		}
	};

	const ssoProviders = [
		{ value: "okta", label: "Okta" },
		{ value: "entra", label: "Microsoft Entra ID (Azure AD)" },
	];

	if (isLoading) {
		return <div className="flex h-64 items-center justify-center">Loading...</div>;
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Single Sign-On (SSO)</h1>
				<p className="text-muted-foreground">Configure identity provider integration for enterprise authentication</p>
			</div>

			<Alert>
				<Info className="h-4 w-4" />
				<AlertDescription>
					SSO integration enables users to authenticate using your organization's identity provider (Okta or Microsoft Entra
					ID). User roles and team memberships can be automatically synchronized from IdP groups.
				</AlertDescription>
			</Alert>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShieldCheck className="h-5 w-5" />
								Identity Provider Configuration
							</CardTitle>
							<CardDescription>Connect Bifrost to your identity provider</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="enabled"
								render={({ field }) => (
									<FormItem className="flex items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Enable Single Sign-On</FormLabel>
											<FormDescription>Allow users to authenticate via your identity provider</FormDescription>
										</div>
										<FormControl>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</FormControl>
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="provider"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Identity Provider</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select identity provider" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{ssoProviders.map((provider) => (
													<SelectItem key={provider.value} value={provider.value}>
														{provider.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>Choose your organization's identity provider</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							{form.watch("provider") === "okta" && (
								<FormField
									control={form.control}
									name="issuer"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Okta Issuer URL</FormLabel>
											<FormControl>
												<Input
													placeholder="https://your-org.okta.com/oauth2/default"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormDescription>Your Okta OAuth 2.0 issuer URL</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}

							<FormField
								control={form.control}
								name="client_id"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Client ID</FormLabel>
										<FormControl>
											<Input placeholder="Enter client ID" {...field} value={field.value ?? ""} />
										</FormControl>
										<FormDescription>OAuth 2.0 client ID from your identity provider</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="client_secret"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Client Secret</FormLabel>
										<FormControl>
											<Input type="password" placeholder="Enter client secret" {...field} value={field.value ?? ""} />
										</FormControl>
										<FormDescription>OAuth 2.0 client secret from your identity provider</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="redirect_uri"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Redirect URI</FormLabel>
										<FormControl>
											<Input placeholder="https://bifrost.your-domain.com/auth/callback" {...field} />
										</FormControl>
										<FormDescription>
											Configure this URI in your identity provider's application settings
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="scopes"
								render={({ field }) => (
									<FormItem>
										<FormLabel>OAuth Scopes</FormLabel>
										<FormControl>
											<Input placeholder="openid email profile" {...field} />
										</FormControl>
										<FormDescription>Space-separated list of OAuth scopes (e.g., openid email profile)</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className="grid gap-4 md:grid-cols-2">
								<FormField
									control={form.control}
									name="user_id_claim"
									render={({ field }) => (
										<FormItem>
											<FormLabel>User ID Claim</FormLabel>
											<FormControl>
												<Input placeholder="sub" {...field} />
											</FormControl>
											<FormDescription>JWT claim field for user ID</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="email_claim"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email Claim</FormLabel>
											<FormControl>
												<Input placeholder="email" {...field} />
											</FormControl>
											<FormDescription>JWT claim field for email address</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="name_claim"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Name Claim</FormLabel>
											<FormControl>
												<Input placeholder="name" {...field} />
											</FormControl>
											<FormDescription>JWT claim field for user name</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="groups_claim"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Groups Claim</FormLabel>
											<FormControl>
												<Input placeholder="groups" {...field} />
											</FormControl>
											<FormDescription>JWT claim field for group memberships</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Role Mapping (Optional)</CardTitle>
							<CardDescription>Map identity provider groups to Bifrost roles</CardDescription>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Configure role mappings in your identity provider to automatically assign Bifrost roles based on group
								memberships. Users will inherit roles from their IdP groups upon login.
							</p>
							<div className="mt-4 space-y-2">
								<div className="flex items-center justify-between rounded-md border p-3">
									<div>
										<p className="font-medium">Admin Role</p>
										<p className="text-sm text-muted-foreground">Map IdP group &quot;Admin&quot; to Bifrost Admin role</p>
									</div>
								</div>
								<div className="flex items-center justify-between rounded-md border p-3">
									<div>
										<p className="font-medium">Developer Role</p>
										<p className="text-sm text-muted-foreground">Map IdP group &quot;Developer&quot; to Bifrost Developer role</p>
									</div>
								</div>
								<div className="flex items-center justify-between rounded-md border p-3">
									<div>
										<p className="font-medium">Viewer Role</p>
										<p className="text-sm text-muted-foreground">Map IdP group &quot;Viewer&quot; to Bifrost Viewer role</p>
									</div>
								</div>
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
