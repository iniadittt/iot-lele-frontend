import { useEffect } from "react";
import type { Route } from "./+types/home";
import { useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
	return [{ title: "Aplikasi Monitoring Sawi Menggunakan Internet Of Things" }, { name: "Sawiku", content: "Selamat datang di aplikasi monitoring sawi menggunakan Internet Of Things!" }];
}

export default function page() {
	const navigate = useNavigate();
	useEffect(() => {
		navigate("/login");
	}, [navigate]);
	return null;
}
