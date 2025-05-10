import React, { useEffect } from "react";
import Icon from "../../images/icon-02.svg";
import { useCredStore } from "../../store/data";
import { useExpensesStore } from "../../store/data";
import formatMoney from "../../utils/formatMoney";
import supabase from "../../lib/supabase";
import { toast } from "sonner";

function DashboardCard02() {
	const token = localStorage.getItem("token");
	const { cred } = useCredStore();
	const { expenses, setExpenses } = useExpensesStore();

	const getExpenses = async () => {
		try {
			if (cred.role === "super") {
				const { data, error } = await supabase.from("expenses").select("*");

				if (error) {
					toast.error(
						"Error retrieving all the expenses from all branches. Please check your internet connection."
					);
					return;
				}

				const totalExpenses = data.reduce((acc, curr) => acc + curr.amount, 0);

				setExpenses(totalExpenses);
			} else {
				const { data, error } = await supabase
					.from("expenses")
					.select("*")
					.eq("branch_id", cred.branch_id);

				if (error) {
					toast.error(
						"Error retrieving all the expenses from all branches. Please check your internet connection."
					);
					return;
				}

				const totalExpenses = data.reduce((acc, curr) => acc + curr.amount, 0);

				console.log(totalExpenses);
				setExpenses(totalExpenses);
			}
		} catch (err) {
			console.log(err);
			throw new Error("Error getting sales");
		}
	};

	useEffect(() => {
		getExpenses();
	}, []);
	return (
		<div className='flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700'>
			<div className='px-5 pt-5'>
				<header className='flex justify-between items-start mb-2'>
					{/* Icon */}
					<img
						src={Icon}
						width='32'
						height='32'
						alt='Icon 02'
					/>
					{/* Menu button */}
				</header>
				<h2 className='text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2'>
					{cred.role === "super"
						? "EXPENSES ON ALL BRANCHES"
						: `${"EXPENSES IN YOUR BRANCH"}`}
				</h2>
				<div className='text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1'>
					{cred.role === "super"
						? "Total Expenses on all branches"
						: "Expenses on your branch"}
				</div>
				<div className='flex items-start'>
					<div className='text-3xl font-bold text-slate-800 dark:text-slate-100 mr-2'>
						₱{formatMoney(expenses)}
					</div>
					<div className='text-sm font-semibold text-white px-1.5 bg-amber-500 rounded-full'>
						sum
					</div>
				</div>
			</div>
		</div>
	);
}

export default DashboardCard02;
