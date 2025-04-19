import type { Route } from "./+types/login";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Cookies from "js-cookie";
import { BACKEND_URL, TOKEN_EXPIRED } from "~/constant";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Login | Monitoring Kolam Lele Menggunakan Internet Of Things" }, { name: "Leleku", content: "Login" }];
}

export default function page() {
	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [data, setData] = useState({
		username: "",
		password: "",
	});

	useEffect(() => {
		if (typeof window !== "undefined") {
			const accessToken = Cookies.get("token");
			if (accessToken) {
				navigate("/dashboard");
			}
		}
	}, [navigate]);

	const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setData({ ...data, [event.target.name]: event.target.value });
	};

	const handlerLogin = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsLoading(true);
		setError("");
		try {
			const response = await fetch(`${BACKEND_URL}/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error("Unauthorized");
			const result = await response.json();
			console.log({ result });
			if (!result.success) {
				setError(result.message);
				return;
			}
			const token = result.data.token;
			Cookies.set("token", token, { expires: TOKEN_EXPIRED });
			navigate("/dashboard");
			setError("");
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
			<div className="w-full max-w-sm md:max-w-3xl">
				<div className="flex flex-col gap-6">
					<Card className="overflow-hidden">
						<CardContent className="grid p-0 md:grid-cols-2">
							<form
								className="p-6 md:p-8"
								method="post"
								onSubmit={handlerLogin}
							>
								<div className="flex flex-col gap-6">
									<div className="flex flex-col items-center text-center">
										<h1 className="text-2xl font-bold">Masuk</h1>
										<p className="text-balance text-muted-foreground">Masuk ke akun anda menggunakan username dan password</p>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="username">Username</Label>
										<Input
											type="text"
											id="username"
											name="username"
											placeholder="Masukkan username anda..."
											onChange={handleChange}
											disabled={isLoading}
											required
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="password">Password</Label>
										<Input
											type="password"
											id="password"
											name="password"
											placeholder="Masukkan password anda..."
											onChange={handleChange}
											disabled={isLoading}
											required
										/>
									</div>
									<Button
										type="submit"
										className="w-full bg-chart-3 hover:bg-chart-3/90 cursor-pointer"
										disabled={isLoading}
									>
										Masuk
									</Button>
								</div>
							</form>
							<div className="relative hidden bg-muted md:block">
								<img
									src="/background.png"
									alt="Image"
									className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
								/>
							</div>
						</CardContent>
					</Card>
					<div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">Sistem Monitoring Kolam Lele (PH Air dan Kekeruhan).</div>
				</div>
			</div>
		</div>
	);
}
