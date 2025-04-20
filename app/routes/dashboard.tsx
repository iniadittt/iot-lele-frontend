import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/dashboard";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import { BACKEND_URL } from "~/constant";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "~/components/ui/breadcrumb";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "~/components/ui/chart";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { formatTanggal } from "../lib/utils";

interface DataSensorType {
	type: "PH_AIR" | "KEKERUHAN";
	value: number;
	createdAt: Date;
}

interface DataDetailSensorType {
	ph: number;
	kekeruhan: number;
	skor: number;
	kategori: "Baik" | "Normal" | "Buruk" | null;
	createdAt: Date | null;
}

const socket = io(BACKEND_URL, {
	transports: ["websocket"],
});

const chartConfigPhAir = {
	phair: {
		label: "Ph Air",
	},
	value: {
		label: "Value",
		color: "hsl(var(--chart-1))",
	},
} satisfies ChartConfig;

const chartConfigKekeruhan = {
	kekeruhan: {
		label: "Kekeruhan",
	},
	value: {
		label: "Value",
		color: "hsl(var(--chart-2))",
	},
} satisfies ChartConfig;

export function meta({}: Route.MetaArgs) {
	return [{ title: "Dashboard | Monitoring Kolam Lele Menggunakan Internet Of Things" }, { name: "Leleku", content: "Dashboard" }];
}

export default function Dashboard() {
	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [data, setData] = useState<{
		sensor: {
			ph: DataSensorType[];
			kekeruhan: DataSensorType[];
		};
		detail: DataDetailSensorType;
	}>({
		sensor: {
			ph: [],
			kekeruhan: [],
		},
		detail: {
			ph: 0,
			kekeruhan: 0,
			skor: 0,
			kategori: null,
			createdAt: null,
		},
	});

	useEffect(() => {
		const fetchData = async () => {
			setIsLoading(true);
			if (typeof window === "undefined") return;
			const accessToken = Cookies.get("token");
			if (!accessToken) {
				navigate("/login");
				setIsLoading(false);
				return;
			}
			try {
				const response = await fetch(`${BACKEND_URL}/sensor`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
					},
				});
				if (!response.ok) return;
				const result = await response.json();
				const resultData = result.data;
				const dataPh = resultData?.sensor?.length > 1 ? resultData.sensor.filter((item: DataSensorType) => item.type === "PH_AIR").sort((a: DataSensorType, b: DataSensorType) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
				const dataKekeruhan = resultData?.sensor?.length > 1 ? resultData.sensor.filter((item: DataSensorType) => item.type === "KEKERUHAN").sort((a: DataSensorType, b: DataSensorType) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : [];
				setData((prev) => ({
					...prev,
					sensor: {
						ph: Array.isArray(dataPh) ? dataPh : [],
						kekeruhan: Array.isArray(dataKekeruhan) ? dataKekeruhan : [],
					},
					detail: {
						ph: resultData.detail.ph,
						kekeruhan: resultData.detail.kekeruhan,
						skor: resultData.detail.skor,
						kategori: resultData.detail.kategori,
						createdAt: resultData.detail.createdAt,
					},
				}));
			} catch (error) {
				console.error("Error fetching data:", error);
				Cookies.remove("token");
				navigate("/login");
			} finally {
				setIsLoading(false);
			}
		};
		fetchData();

		if (socket) {
			socket.on("getDataSensor", (data) => {
				const dataPh = data.sensor.filter((item: DataSensorType) => item.type === "PH_AIR").sort((a: DataSensorType, b: DataSensorType) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
				const dataKekeruhan = data.sensor.filter((item: DataSensorType) => item.type === "KEKERUHAN").sort((a: DataSensorType, b: DataSensorType) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
				setData((prev) => ({
					...prev,
					sensor: {
						ph: Array.isArray(dataPh) ? dataPh : [],
						kekeruhan: Array.isArray(dataKekeruhan) ? dataKekeruhan : [],
					},
					detail: {
						ph: data.detail.ph,
						kekeruhan: data.detail.kekeruhan,
						skor: data.detail.skor,
						kategori: data.detail.kategori,
						createdAt: data.detail.createdAt,
					},
				}));
			});
		}

		return () => {
			if (socket) {
				socket.off("getDataSensor");
			}
		};
	}, [navigate]);

	const handlerLogout = async (event: React.FormEvent) => {
		event.preventDefault();
		setIsLoading(true);
		setError("");
		try {
			Cookies.remove("token");
			navigate("/login");
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) return <p>Loading...</p>;

	return (
		<div>
			<header className="border-b">
				<div className="flex justify-between h-16 shrink-0 items-center gap-2 xl:w-[1280px] px-4 mx-auto">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbPage className="font-bold xl:text-2xl text-lg">Sistem Monitoring Kolam Lele</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<Button
						className="bg-chart-3 hover:bg-chart-3/90 cursor-pointer"
						onClick={handlerLogout}
					>
						Keluar
					</Button>
				</div>
			</header>

			<div className="xl:w-[1280px] mx-auto pt-6 py-16 px-4">
				<div className="grid xl:grid-cols-3 gap-4">
					<Card className={cn("@container/card", data.detail.kategori === "Baik" ? "bg-green-700 text-slate-50 border-green-500" : data.detail.kategori === "Normal" ? "bg-yellow-600 text-slate-50 border-yellow-500" : data.detail.kategori === "Buruk" ? "bg-red-700 text-slate-50 border-red-500" : "")}>
						<CardHeader className="relative">
							<CardDescription className={cn(data.detail.kategori && "text-slate-50")}>Status Air Kolam</CardDescription>
							<CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{data?.detail?.kategori ?? "-"}</CardTitle>
						</CardHeader>
						<CardFooter className="flex-col items-start gap-1 text-sm">
							<div className="line-clamp-1 flex gap-2 font-medium">Data terakhir diupdate pada:</div>
							<div className={cn(data.detail.kategori && "text-slate-50")}>{data?.detail?.createdAt ? formatTanggal(data.detail.createdAt) : "-"}</div>
						</CardFooter>
					</Card>

					<Card className="@container/card">
						<CardHeader className="relative">
							<CardDescription>Ph Air Kolam</CardDescription>
							<CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{data?.sensor?.ph?.[data.sensor.ph.length - 1]?.value ?? "0"}</CardTitle>
						</CardHeader>
						<CardFooter className="flex-col items-start gap-1 text-sm">
							<div className="line-clamp-1 flex gap-2 font-medium">Data terakhir diupdate pada:</div>
							<div className="text-muted-foreground">{data?.sensor?.ph?.[data.sensor.ph.length - 1]?.createdAt ? formatTanggal(data.sensor.ph[data.sensor.ph.length - 1].createdAt) : "-"}</div>
						</CardFooter>
					</Card>

					<Card className="@container/card">
						<CardHeader className="relative">
							<CardDescription>Kekeruhan Air Kolam</CardDescription>
							<CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">{data?.sensor?.kekeruhan?.[data.sensor.kekeruhan.length - 1]?.value ?? "0"} %</CardTitle>
						</CardHeader>
						<CardFooter className="flex-col items-start gap-1 text-sm">
							<div className="line-clamp-1 flex gap-2 font-medium">Data terakhir diupdate pada:</div>
							<div className="text-muted-foreground">{data?.sensor?.kekeruhan?.[data.sensor.kekeruhan.length - 1]?.createdAt ? formatTanggal(data.sensor.kekeruhan[data.sensor.kekeruhan.length - 1].createdAt) : "-"}</div>
						</CardFooter>
					</Card>
				</div>

				<div className="grid xl:grid-cols-2 mt-4 gap-4">
					<Card className="@container/card">
						<CardHeader className="relative">
							<CardTitle>Sensor Ph Air</CardTitle>
							<CardDescription>
								<span className="@[540px]/card:block">50 Data</span>
							</CardDescription>
						</CardHeader>
						<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
							<ChartContainer
								config={chartConfigPhAir}
								className="aspect-auto h-[250px] w-full"
							>
								<AreaChart data={data.sensor.ph}>
									<defs>
										<linearGradient
											id="fillDesktop"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="var(--primary)"
												stopOpacity={1.0}
											/>
											<stop
												offset="95%"
												stopColor="var(--primary)"
												stopOpacity={0.1}
											/>
										</linearGradient>
										<linearGradient
											id="fillMobile"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="var(--primary)"
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor="var(--primary)"
												stopOpacity={0.1}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="createdAt"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										minTickGap={32}
										tickFormatter={(value) => {
											const date = new Date(value);
											return date.toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
											});
										}}
									/>
									<ChartTooltip
										cursor={false}
										content={
											<ChartTooltipContent
												labelFormatter={(value) => {
													return new Date(value).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
													});
												}}
												indicator="dot"
											/>
										}
									/>
									<Area
										dataKey="value"
										type="linear"
										fill="var(--chart-3)"
										stroke="var(--chart-3)"
										stackId="a"
									/>
								</AreaChart>
							</ChartContainer>
						</CardContent>
					</Card>

					<Card className="@container/card">
						<CardHeader className="relative">
							<CardTitle>Sensor Kekeruhan Air</CardTitle>
							<CardDescription>
								<span className="@[540px]/card:block">50 Data</span>
							</CardDescription>
						</CardHeader>
						<CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
							<ChartContainer
								config={chartConfigKekeruhan}
								className="aspect-auto h-[250px] w-full"
							>
								<AreaChart data={data.sensor.kekeruhan}>
									<defs>
										<linearGradient
											id="fillDesktop"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="var(--primary)"
												stopOpacity={1.0}
											/>
											<stop
												offset="95%"
												stopColor="var(--primary)"
												stopOpacity={0.1}
											/>
										</linearGradient>
										<linearGradient
											id="fillMobile"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="var(--primary)"
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor="var(--primary)"
												stopOpacity={0.1}
											/>
										</linearGradient>
									</defs>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="createdAt"
										tickLine={false}
										axisLine={false}
										tickMargin={10}
										minTickGap={32}
										tickFormatter={(value) => {
											const date = new Date(value);
											return date.toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
											});
										}}
									/>
									<ChartTooltip
										cursor={false}
										content={
											<ChartTooltipContent
												labelFormatter={(value) => {
													return new Date(value).toLocaleDateString("en-US", {
														month: "short",
														day: "numeric",
													});
												}}
												indicator="dot"
											/>
										}
									/>
									<Area
										dataKey="value"
										type="linear"
										fill="var(--chart-2)"
										stroke="var(--chart-2)"
										stackId="a"
									/>
								</AreaChart>
							</ChartContainer>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
