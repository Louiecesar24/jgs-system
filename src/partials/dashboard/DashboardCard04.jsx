import React, { useState, useEffect } from "react";
import Icon from "../../images/icon-03.svg";
import { useCredStore } from "../../store/data";
import { useSalesStore } from "../../store/data";
import supabase from "../../lib/supabase";
import formatMoney from "../../utils/formatMoney";
import { toast, Toaster } from "sonner";

function DashboardCard04() {
	const token = localStorage.getItem("token");
	const { allSales, setAllSales } = useSalesStore();
	const { cred } = useCredStore();

	const getTotalSales = async () => {
		try {
			const { data, error } = await supabase.from("sales").select("*");

			if (error) {
				toast.error("Error retrieving sales from all branches");
				return;
			}

			const totalSales = data.reduce((acc, curr) => acc + Number(curr.amount), 0);

			setAllSales(totalSales);
		} catch (err) {
			console.log(err);
			throw new Error("Error getting sales");
		}
	};

	useEffect(() => {
		getTotalSales();
	}, []);

	return (
		<div className='flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700'>
			<Toaster
				richColors
				position='top-center'
			/>
			<div className='px-5 py-5'>
				<header className='flex justify-between items-start mb-2'>
					{/* Icon */}
					<img
						src={Icon}
						width='32'
						height='32'
						alt='Icon 03'
					/>
				</header>
				<h2 className='text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2'>
					TOTAL SALES ON ALL BRANCHES
				</h2>
				<div className='text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1'>
					Total amount of sales in all branches
				</div>
				<div className='flex items-start'>
					{typeof allSales === "number" && (
						<div className='text-3xl font-bold text-slate-800 dark:text-slate-100 mr-2'>
							₱{formatMoney(allSales)}
						</div>
					)}
					<div className='text-sm font-semibold text-white px-1.5 bg-emerald-500 rounded-full'>
						sum
					</div>
				</div>
			</div>
		</div>
	);
}

export default DashboardCard04;
