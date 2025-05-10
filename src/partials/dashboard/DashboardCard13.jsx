import React, { useEffect, useState } from "react";
import { useCredStore } from "../../store/data";
import { useTop } from "../../store/data";
import supabase from "../../lib/supabase"; // Make sure to import supabase correctly
import formatMoney from "../../utils/formatMoney";

function DashboardCard13() {
	const token = localStorage.getItem("token");
	const { cred } = useCredStore();
	const { result, setResult } = useTop();
	const [latestTransactions, setLatestTransactions] = useState([]);

	const getTopThree = async () => {
		try {
			// Fetch the latest 3 sales transactions
			const { data: salesData, error: salesError } = await supabase
				.from("sales")
				.select("*, created_at")
				.order("created_at", { ascending: false })
				.limit(3);

			if (salesError) throw salesError;

			// Fetch the latest 3 expense transactions
			const { data: expensesData, error: expensesError } = await supabase
				.from("expenses")
				.select("*, created_at")
				.order("created_at", { ascending: false })
				.limit(3);

			if (expensesError) throw expensesError;

			// Combine sales and expenses data
			const combinedData = [...(salesData || []), ...(expensesData || [])];

			// Sort combined data by created_at date
			const sortedData = combinedData.sort(
				(a, b) => new Date(b.created_at) - new Date(a.created_at)
			);

			// Get the top 3 transactions
			const topThreeTransactions = sortedData.slice(0, 3);

			setLatestTransactions(topThreeTransactions);
		} catch (err) {
			console.log(err);
			throw new Error("Error getting sales and expenses");
		}
	};

	useEffect(() => {
		getTopThree();
	}, []);

	return (
		<div className='col-span-full xl:col-span-6 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700'>
			<header className='px-5 py-4 border-b border-slate-100 dark:border-slate-700'>
				<h2 className='font-semibold text-slate-800 dark:text-slate-100'>
					Income/Expenses
				</h2>
			</header>
			<div className='p-3'>
				<div>
					<header className='text-xs uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 dark:bg-opacity-50 rounded-sm font-semibold p-2'>
						Today
					</header>
					{latestTransactions.length > 0 ? (
						latestTransactions.map((res, idx) => {
							return (
								<ul
									key={idx}
									className='my-1'>
									<li className='flex px-2'>
										<div
											className={`w-9 h-9 rounded-full shrink-0 my-2 mr-3 ${
												res.payment_method ? "bg-emerald-500" : "bg-red-500"
											}`}>
											{/* Assuming payment_method indicates income */}
											<svg
												className='w-9 h-9 fill-current text-emerald-50'
												viewBox='0 0 36 36'>
												<path d='M18.3 11.3l-1.4 1.4 4.3 4.3H11v2h10.2l-4.3 4.3 1.4 1.4L25 18z' />
											</svg>
										</div>
										<div className='grow flex items-center border-b border-slate-100 dark:border-slate-700 text-sm py-2'>
											<div className='grow flex justify-between'>
												<div className='self-center'>
													<a
														className='font-medium text-slate-800 hover:text-slate-900 dark:text-slate-100 dark:hover:text-white'
														href='#0'>
														{res.payment_method ? "Sales: " : "Expenses: "}
													</a>{" "}
													{/* Display date issued if available */}
													{res.date_issued
														? new Date(res.date_issued).toLocaleDateString()
														: "Unknown date"}
												</div>
												<div className='shrink-0 self-start ml-2'>
													<span
														className={`font-medium ${
															res.payment_method ? "text-emerald-500" : "text-red-500"
														}`}>
														{res.payment_method ? "+" : "-"}₱{formatMoney(res.amount)}
													</span>
												</div>
											</div>
										</div>
									</li>
								</ul>
							);
						})
					) : (
						<h1>No incomes and expenses today</h1>
					)}
				</div>
			</div>
		</div>
	);
}

export default DashboardCard13;
