import { useEffect, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import supabase from "../../lib/supabase";
import { useCredStore } from "../../store/data";

function DashboardCard05() {
	const { cred } = useCredStore();
	const [monthlySales, setMonthlySales] = useState(Array(12).fill(0));
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
	const years = Array.from({ length: 57 }, (_, i) => 2024 + i);

	const getMonthlySales = async (year) => {
		try {
			const startDate = `${year}-01-01`;
			const endDate = `${year}-12-31`;

			const { data, error } = await supabase
				.from("sales")
				.select("amount, created_at")
				.gte("created_at", startDate)
				.lte("created_at", endDate)
				.eq("branch_id", cred?.branch_id);

			if (error) {
				console.error("Error fetching sales by month:", error);
				return [];
			}

			const monthlySales = Array(12).fill(0);

			data.forEach((sale) => {
				const saleMonth = new Date(sale.created_at).getMonth();
				monthlySales[saleMonth] += sale.amount;
			});

			return monthlySales;
		} catch (err) {
			console.error("Error in getMonthlySales:", err);
			throw new Error("Unable to fetch monthly sales.");
		}
	};

	const darkTheme = createTheme({
		palette: {
			mode: "light",
			text: {
				primary: "#64748b",
			},
		},
	});

	useEffect(() => {
		const fetchSales = async () => {
			const sales = await getMonthlySales(selectedYear);
			setMonthlySales(sales);
		};

		fetchSales();
	}, [selectedYear]);

	const handleYearChange = (event) => {
		setSelectedYear(Number(event.target.value));
	};

	return (
		<ThemeProvider theme={darkTheme}>
			<div
				className={`col-span-full xl:col-span-6 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700`}>
				<header className='px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between'>
					<h2 className={`font-semibold text-slate-800 dark:text-slate-100`}>
						Monthly sales in year {selectedYear}
					</h2>
					<select
						value={selectedYear}
						onChange={handleYearChange}
						className='ml-4 border rounded-md p-1'>
						{years.map((year) => (
							<option
								key={year}
								value={year}>
								{year}
							</option>
						))}
					</select>
				</header>
				<div className='p-3'>
					<LineChart
						xAxis={[
							{
								data: [
									"Jan",
									"Feb",
									"Mar",
									"Apr",
									"May",
									"Jun",
									"Jul",
									"Aug",
									"Sep",
									"Oct",
									"Nov",
									"Dec",
								],
								scaleType: "band",
							},
						]}
						series={[
							{
								data: monthlySales,
								area: true,
							},
						]}
						height={370}
					/>
				</div>
			</div>
		</ThemeProvider>
	);
}

export default DashboardCard05;
