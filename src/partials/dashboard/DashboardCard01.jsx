import React, { useEffect } from "react";
import Icon from "../../images/icon-01.svg";
import { useSalesStore } from "../../store/data";
import { useCredStore } from "../../store/data";
import formatMoney from "../../utils/formatMoney";
import supabase from "../../lib/supabase";
import { toast, Toaster } from "sonner";
// Import utilities
import { tailwindConfig, hexToRGB } from "../../utils/Utils";

function DashboardCard01() {
	const token = localStorage.getItem("token");
	const { cred } = useCredStore();
	const { sales, setSales } = useSalesStore();

	const getSales = async () => {
		try {
			const today = new Date().toISOString().split("T")[0];

			if (cred.role === "super") {
				const { data, error } = await supabase
					.from("sales")
					.select("*")
					.gte("created_at", today)
					.lt("created_at", today + "T23:59:59");

				if (error) {
					toast.error("Error getting the total sales from all branches");
					return;
				}

				const totalSales = data.reduce((acc, curr) => acc + curr.amount, 0);
				setSales(totalSales);
			} else {
				const { data, error } = await supabase
					.from("sales")
					.select("*")
					.eq("branch_id", cred?.branch_id)
					.gte("created_at", today)
					.lt("created_at", today + "T23:59:59");

				if (error) {
					toast.error("Error getting the total sales of this branch");
					return;
				}

				const totalSales = data.reduce((acc, curr) => acc + curr.amount, 0);
				setSales(totalSales);
			}
		} catch (err) {
			console.log(err);
			throw new Error("Error getting sales");
		}
	};

	useEffect(() => {
		getSales();
	}, []);
	return (
		<div className='flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700'>
			<Toaster
				richColors
				position='top-center'
			/>
			<div className='px-5 pt-5'>
				<header className='flex justify-between items-start mb-2'>
					{/* Icon */}
					<img
						src={Icon}
						width='32'
						height='32'
						alt='Icon 01'
					/>
					{/* Menu button */}
				</header>
				<h2 className='text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2'>
					{cred.role === "super"
						? "DAILY SALES ON ALL BRANCHES"
						: "DAILY SALES ON YOUR BRANCH"}
				</h2>
				<div className='text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1'>
					Sales on the same day
				</div>
				<div className='flex items-start'>
					<div className='text-3xl font-bold text-slate-800 dark:text-slate-100 mr-2'>
						₱{sales ? formatMoney(sales) : 0}
					</div>
					<div className='text-sm font-semibold text-white px-1.5 bg-emerald-500 rounded-full'>
						sum
					</div>
				</div>
			</div>
		</div>
	);
}

export default DashboardCard01;
