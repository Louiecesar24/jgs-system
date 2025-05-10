import { useEffect, useState } from "react";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	Cell,
} from "recharts";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import supabase from "../../lib/supabase";
import { useCredStore } from "../../store/data";

const COLORS = [
	"#0088FE",
	"#00C49F",
	"#FFBB28",
	"#FF8042",
	"#AF19FF",
	"#FF4560",
	"#00E396",
	"#775DD0",
	"#FEB019",
	"#FF4560",
	"#00E396",
	"#775DD0",
];

function DashboardCard06() {
	const { cred } = useCredStore();
	const [monthlyExpenses, setMonthlyExpenses] = useState(Array(12).fill(0));
	const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
	const years = Array.from({ length: 57 }, (_, i) => 2024 + i);

	const getMonthlyExpenses = async (year) => {
		try {
			const startDate = `${year}-01-01`;
			const endDate = `${year}-12-31`;

			const { data, error } = await supabase
				.from("expenses")
				.select("amount, created_at")
				.gte("created_at", startDate)
				.lte("created_at", endDate)
				.eq("branch_id", cred?.branch_id);

			if (error) {
				console.error("Error fetching expenses by month:", error);
				return [];
			}

			const monthlyExpenses = Array(12).fill(0);

			data.forEach((expense) => {
				const expenseMonth = new Date(expense.created_at).getMonth();
				monthlyExpenses[expenseMonth] += expense.amount;
			});

			return monthlyExpenses;
		} catch (err) {
			console.error("Error in monthlyExpenses:", err);
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
		const fetchExpenses = async () => {
			const expenses = await getMonthlyExpenses(selectedYear);
			setMonthlyExpenses(expenses);
		};

		fetchExpenses();
	}, [selectedYear]);

	const handleYearChange = (event) => {
		setSelectedYear(Number(event.target.value));
	};

	const data = monthlyExpenses.map((expense, index) => ({
		name: [
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
		][index],
		value: expense,
	}));

	return (
		<ThemeProvider theme={darkTheme}>
			<div
				className={`col-span-full xl:col-span-6 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700`}>
				<header className='px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between'>
					<h2 className={`font-semibold text-slate-800 dark:text-slate-100`}>
						Monthly expenses in year {selectedYear}
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
					<ResponsiveContainer
						width='100%'
						height={370}>
						<BarChart data={data}>
							<CartesianGrid strokeDasharray='3 3' />
							<XAxis dataKey='name' />
							<YAxis />
							<Tooltip />
							<Legend />
							<Bar
								dataKey='value'
								fill='#8884d8'>
								{data.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={COLORS[index % COLORS.length]}
									/>
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		</ThemeProvider>
	);
}

export default DashboardCard06;
