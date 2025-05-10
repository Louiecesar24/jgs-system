import React, { useEffect, useState } from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import supabase from "../../lib/supabase";
import { toast } from "sonner";

function DashboardCard11() {
	const [data, setData] = useState([]);
	const [totalSales, setTotalSales] = useState(0);

	const getTotalSales = async () => {
		try {
			const { data: salesData, error: salesError } = await supabase
				.from("sales")
				.select("*");

			if (salesError) {
				throw new Error("Error fetching sales data.");
			}

			const { data: branchesData, error: branchesError } = await supabase
				.from("branches")
				.select("id, branch_name");

			if (branchesError) {
				throw new Error("Error fetching branches data.");
			}

			const salesWithBranchNames = salesData.map((sale) => {
				const branch = branchesData.find((branch) => branch.id === sale.branch_id);
				return {
					id: sale.id,
					value: sale.amount,
					label: branch ? branch.branch_name : "Unknown Branch",
				};
			});

			const aggregatedSales = salesWithBranchNames.reduce((acc, sale) => {
				const existing = acc.find((item) => item.label === sale.label);
				if (existing) {
					existing.value += sale.value;
				} else {
					acc.push({ id: sale.id, value: sale.value, label: sale.label });
				}
				return acc;
			}, []);

			const uniqueAggregatedSales = aggregatedSales.map((sale, index) => ({
				id: index + 1,
				value: sale.value,
				label: sale.label,
			}));

			const total = uniqueAggregatedSales.reduce(
				(acc, sale) => acc + sale.value,
				0
			);

			setData(uniqueAggregatedSales);
			setTotalSales(total);
		} catch (error) {
			toast.error("Error getting the data. Please check your internet connection");
			console.error(error);
		}
	};

	useEffect(() => {
		getTotalSales();
	}, []);

	return (
		<div className='col-span-full xl:col-span-6 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700'>
			<header className='px-5 py-4 border-b border-slate-100 dark:border-slate-700'>
				<h2 className='font-semibold text-slate-800 dark:text-slate-100'>
					Total Sales in all branches: ₱{totalSales.toLocaleString()}
				</h2>
			</header>
			<div className='flex px-5 py-3'>
				<PieChart
					series={[
						{
							data,
							highlightScope: { fade: "global", highlight: "item" },
							faded: { innerRadius: 30, additionalRadius: -30, color: "gray" },
						},
					]}
					height={300}
				/>
			</div>
		</div>
	);
}

export default DashboardCard11;
