import React, { useState, useEffect } from "react";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import { AddExp } from "./Modals/AddExp";
import { ExpEdit } from "./Modals/ExpEdit";
import { useExpensesStore } from "../../store/data";
import formatMoney from "../../utils/formatMoney";
import { useDatePick } from "../../store/data";

import Datepicker from "../../components/Datepicker";

import supabase from "../../lib/supabase";
import { useCredStore } from "../../store/data";
import { toast } from "sonner";
import { fetchInstallmentsAndNotify } from "../../utils/notifier";

const ExpensesRow = ({ data, handleDeleteExpense }) => {
	console.log(data);
	return (
		<tr className='odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700'>
			<th
				scope='row'
				className='px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white'>
				{new Date(data?.created_at).toLocaleDateString("en-US", {
					month: "long",
					day: "2-digit",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
				})}
			</th>
			<td className='px-6 py-4'>{data?.branches?.branch_name}</td>
			<td className='px-6 py-4'>{data?.amount}</td>
			<td className='px-6 py-4'>{data?.remarks}</td>
			<td className='px-6 py-4'>{data?.employee_name}</td>
			<td className='px-6 py-4'>
				<a
					onClick={() => handleDeleteExpense(data?.id)}
					href='#'
					className='bg-red-500 px-2 py-1 rounded-md font-medium text-white dark:text-blue-500 hover:underline'>
					Delete
				</a>
			</td>
		</tr>
	);
};

const SalesRow = ({ date, amount, remarks, onEdit }) => {
	return (
		<tr className='odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-slate-700'>
			<th
				scope='row'
				className='px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white'>
				{new Date(date).toLocaleDateString("en-US", {
					month: "long",
					day: "2-digit",
					year: "numeric",
				})}
			</th>
			<td className='px-6 py-4'>₱ {formatMoney(amount)}</td>
			<td className='px-6 py-4'>{remarks}</td>
			<td className='px-6 py-4'>
				<button
					onClick={() => onEdit({ date, branch_name, amount, remarks })}
					className='font-medium text-blue-600 dark:text-blue-500 hover:underline'>
					Edit
				</button>
			</td>
		</tr>
	);
};

export const Expenses = () => {
	const { date } = useDatePick();
	const token = localStorage.getItem("token");
	const { cred } = useCredStore();
	const { allExpenses, setAllExpenses, allExpensesAdmin, setAllExpensesAdmin } =
		useExpensesStore();
	const [totalExpense, setTotalExpense] = useState(0);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isExpModalOpen, setExpModalOpen] = useState(false);
	const [selectedExp, setSelectedExp] = useState(null);
	const [isAddModalOpen, setAddModalOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [lastPage, setLastPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredExpenses, setFilteredExpenses] = useState([]);
	const [expensesAllBranches, setExpencesAllBranches] = useState([]);

	const ITEMS_PER_PAGE = 10;

	//get all expenses from specific branch
	//admin
	const handleGetExpenses = async () => {
		try {
			const from = (currentPage - 1) * ITEMS_PER_PAGE;
			const to = currentPage * ITEMS_PER_PAGE - 1;

			const {
				data: response,
				error,
				count,
			} = await supabase
				.from("expenses")
				.select("*", { count: "exact" })
				.order("created_at", { ascending: false })
				.eq("branch_id", cred.branch_id)
				.range(from, to);

			if (error) throw error;

			setTotalExpense(response?.reduce((acc, expense) => acc + expense.amount, 0));
			setAllExpenses(response);
			setFilteredExpenses(response);
			setLastPage(Math.ceil(count / ITEMS_PER_PAGE));
		} catch (err) {
			console.error(err);
			alert("Error retrieving expenses. Please try again later.");
		}
	};

	const handleSearchChange = (event) => {
		setSearchTerm(event.target.value);
	};

	const handleGetAllExpenses = async () => {
		try {
			// Fetch expenses
			const { data: expenses, error: expensesError } = await supabase
				.from("expenses")
				.select("*");

			if (expensesError) {
				console.error(expensesError);
				toast.error("Error getting all expenses");
				return;
			}

			const { data: branches, error: branchesError } = await supabase
				.from("branches")
				.select("*");

			if (branchesError) {
				console.error(branchesError);
				toast.error("Error getting branch details");
				return;
			}

			const branchLookup = branches.reduce((acc, branch) => {
				acc[branch.id] = branch.branch_name;
				return acc;
			}, {});

			const groupedData = expenses.reduce((acc, expense) => {
				const branchName = branchLookup[expense.branch_id] || "Unknown Branch";

				if (!acc[branchName]) {
					acc[branchName] = [];
				}

				acc[branchName].push({
					created_at: expense.created_at,
					amount: expense.amount,
					remarks: expense.remarks,
				});

				return acc;
			}, {});

			const { data, error } = await supabase
				.from("expenses")
				.select(
					`
					id,
					amount, 
					remarks, 
					created_at, 
					employee_name,
					branch_id,
					branches (
						id, branch_name
					) 
				`
				)
				.order("created_at", { ascending: false });

			if (error) return;

			setExpencesAllBranches(data);
			setAllExpensesAdmin(groupedData);
		} catch (err) {
			console.log(err);
			alert("Error retrieving expenses. Please try again later.");
		}
	};

	const handleDeleteExpense = async (id) => {
		const confirmed = confirm(`Are you sure you want to delete this expense?`);

		if (confirmed) {
			try {
				const { err } = await supabase.from("expenses").delete().eq("id", id);

				if (err) {
					toast.error("Error deleting expense");
					return;
				}

				toast.success("Expenses deleted successfully!");
				handleGetAllExpenses();
			} catch (err) {
				console.error(err);
				toast.error("Error deleting expense.");
			}
		} else {
			console.log("Deletion canceled.");
		}
	};

	const handleEdit = (expense) => {
		setSelectedExp(expense);
		setExpModalOpen(true);
	};

	const closeExpModal = () => {
		setExpModalOpen(false);
		setSelectedExp(null);
	};

	const handleAdd = () => {
		setAddModalOpen(true);
	};

	const closeAddModal = () => {
		setAddModalOpen(false);
	};

	const handleClick = (newPage) => {
		setCurrentPage(newPage);
	};

	const handleFilterExpenses = () => {
		const filtered = allExpenses.filter((expense) => {
			return expense.remarks.toLowerCase().includes(searchTerm.toLowerCase());
		});

		setFilteredExpenses(filtered);
	};

	useEffect(() => {
		if (cred.role === "super") handleGetAllExpenses();
	}, []);

	useEffect(() => {
		if (searchTerm === "") handleGetExpenses();
	}, [searchTerm]);

	useEffect(() => {
		if (cred.role === "admin") handleGetExpenses();
	}, [currentPage]);

	useEffect(() => {
		if (cred.role === "admin") fetchInstallmentsAndNotify(cred.branch_id);
	}, []);
	return (
		<div className='flex h-screen overflow-hidden'>
			<Sidebar
				sidebarOpen={sidebarOpen}
				setSidebarOpen={setSidebarOpen}
			/>
			<div className='relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden'>
				{/*  Site header */}
				<Header
					sidebarOpen={sidebarOpen}
					setSidebarOpen={setSidebarOpen}
				/>

				<main>
					{cred.role === "super" && (
						<div className='px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto'>
							<div className='flex flex-col xl:flex-row justify-between items-start xl:items-center'>
								<h1 className='flex flex-col text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-5'>
									Overall Expenses
									<p className='text-base font-normal'>
										Here are all the expenses from your branches.
									</p>
								</h1>
							</div>
							<div className='grid grid-cols-12 gap-6'>
								{Object.keys(allExpensesAdmin)?.map((branchName, idx) => {
									const expenses = allExpensesAdmin[branchName];
									const totalAmount = expenses.reduce(
										(sum, expense) => sum + expense.amount,
										0
									);

									return (
										<div
											key={idx}
											className='flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700'>
											<div className='px-5 py-5'>
												<h2 className='text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2'>
													{branchName} Branch
												</h2>
												<div className='text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1'>
													Expenses
												</div>
												<div className='flex items-start'>
													<div className='text-3xl font-bold text-slate-800 dark:text-slate-100 mr-2'>
														₱{expenses.length ? formatMoney(totalAmount) : 0}{" "}
														{/* Display total amount */}
													</div>
													<div className='text-sm font-semibold text-white px-1.5 bg-emerald-500 rounded-full'>
														total
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
							{/* All expenses table */}
							<div className='mt-10 relative overflow-x-auto shadow-md sm:rounded-lg'>
								<h1 className='font-bold text-3xl mb-3'>Expenses from all branches</h1>
								<table className='max-h-[550px] overflow-y-auto w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400'>
									<thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
										<tr>
											<th
												scope='col'
												className='px-6 py-3'>
												Date Issued
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Branch
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Amount
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Remarks
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Issuer
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Action
											</th>
										</tr>
									</thead>
									<tbody>
										{expensesAllBranches?.map((row, index) => (
											<ExpensesRow
												key={index}
												data={row}
												handleDeleteExpense={handleDeleteExpense}
											/>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{cred.role === "admin" && (
						<div className='px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto'>
							<div className='flex flex-col xl:flex-row justify-between items-start xl:items-center'>
								<h1 className='flex flex-col text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-5'>
									Expenses
									<p className='text-base font-normal'>Here's Your Expenses Overview.</p>
								</h1>
								{/* Daily Sales overview */}
								<div className='flex flex-col sm:flex-row sm:gap-2 md:gap-6'>
									<div className='flex gap-4 items-center p-6 rounded-2xl shadow-lg bg-indigo-500 text-white max-w-[25.5rem] m-auto mb-3 md:mb-6'>
										<svg
											className='w-[50px] h-[50px] text-white'
											fill='#ffff'
											version='1.1'
											id='Layer_1'
											xmlns='http://www.w3.org/2000/svg'
											xmlns:xlink='http://www.w3.org/1999/xlink'
											viewBox='0 0 512 512'
											xml:space='preserve'>
											<g
												id='SVGRepo_bgCarrier'
												stroke-width='0'></g>
											<g
												id='SVGRepo_tracerCarrier'
												stroke-linecap='round'
												stroke-linejoin='round'></g>
											<g id='SVGRepo_iconCarrier'>
												{" "}
												<g>
													{" "}
													<g>
														{" "}
														<path
															stroke-linecap='round'
															stroke-width='1'
															d='M355.003,0H85.333v182.857H48.762V512h256v-36.571h158.476V108.236L355.003,0z M365.714,62.431l35.093,35.093h-35.093 V62.431z M268.19,475.429H85.333v-256H268.19V475.429z M426.667,438.857H304.762v-256H121.905V36.571h207.238v97.524h97.524 V438.857z'></path>{" "}
													</g>{" "}
												</g>{" "}
												<g>
													{" "}
													<g>
														{" "}
														<rect
															x='121.905'
															y='256'
															width='109.714'
															height='36.571'></rect>{" "}
													</g>{" "}
												</g>{" "}
												<g>
													{" "}
													<g>
														{" "}
														<rect
															x='121.905'
															y='329.143'
															width='36.571'
															height='36.571'></rect>{" "}
													</g>{" "}
												</g>{" "}
												<g>
													{" "}
													<g>
														{" "}
														<rect
															x='195.048'
															y='329.143'
															width='36.571'
															height='36.571'></rect>{" "}
													</g>{" "}
												</g>{" "}
												<g>
													{" "}
													<g>
														{" "}
														<rect
															x='121.905'
															y='402.286'
															width='36.571'
															height='36.571'></rect>{" "}
													</g>{" "}
												</g>{" "}
												<g>
													{" "}
													<g>
														{" "}
														<rect
															x='195.048'
															y='402.286'
															width='36.571'
															height='36.571'></rect>{" "}
													</g>{" "}
												</g>{" "}
											</g>
										</svg>
										<div className='flex flex-col font-bold'>
											<h1 className='text-3xl'>₱ {formatMoney(totalExpense)}</h1>
											<p>Total Expenses</p>
										</div>
									</div>
								</div>
							</div>
							<div className='shadow-xl rounded-2xl bg-white dark:bg-slate-800 p-8 sm:flex-col sm:justify-between sm:items-center mb-8'>
								<div className='sm:flex sm:justify-between sm:items-center mb-8'>
									<div className='flex gap-2 items-center'>
										<h1 className='text-2xl font-bold'>Your Expenses</h1>
									</div>
									<div className='flex gap-2 items-center'>
										<div className='relative'>
											<input
												type='text'
												placeholder='Search by remarks'
												value={searchTerm}
												onChange={handleSearchChange}
												className='w-[18.5rem] md:w-[24.5rem] rounded-md border-gray-300 dark:border-none dark:bg-gray-700 pr-10'
											/>
											<svg
												className='absolute right-3 top-1/2 transform -translate-y-1/2'
												width='20'
												height='20'
												viewBox='0 0 24 24'
												fill='none'
												xmlns='http://www.w3.org/2000/svg'
												stroke='#b1b3f8'>
												<path
													d='M21 21l-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0z'
													stroke='#b1b3f8'
													stroke-width='2'
													stroke-linecap='round'
													stroke-linejoin='round'
												/>
											</svg>
										</div>
										<button
											onClick={handleFilterExpenses}
											className='btn bg-indigo-500 hover:bg-indigo-600 text-white gap-2'>
											<p className='font-bold text-md'>Search</p>
										</button>
										<button
											onClick={handleAdd}
											className='btn bg-green-500 hover:bg-green-600 text-white gap-2'>
											<svg
												className='w-[20px] h-[20px]'
												viewBox='0 0 24 24'
												fill='none'
												xmlns='http://www.w3.org/2000/svg'>
												<g
													id='SVGRepo_bgCarrier'
													stroke-width='0'></g>
												<g
													id='SVGRepo_tracerCarrier'
													stroke-linecap='round'
													stroke-linejoin='round'></g>
												<g id='SVGRepo_iconCarrier'>
													{" "}
													<g id='Edit / Add_Plus'>
														{" "}
														<path
															id='Vector'
															d='M6 12H12M12 12H18M12 12V18M12 12V6'
															stroke='#ffff'
															stroke-width='2'
															stroke-linecap='round'
															stroke-linejoin='round'></path>{" "}
													</g>{" "}
												</g>
											</svg>
											<p className='hidden lg:flex sm:block font-bold text-md'>
												Add Expenses
											</p>
										</button>
									</div>
								</div>
								{/* Daily Sales table */}
								<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
									<table className='w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400'>
										<thead className='text-xs text-white uppercase bg-indigo-500'>
											<tr>
												<th
													scope='col'
													className='px-6 py-3'>
													Date
												</th>

												<th
													scope='col'
													className='px-6 py-3'>
													Amount
												</th>
												<th
													scope='col'
													className='px-6 py-3'>
													Remarks
												</th>
												<th
													scope='col'
													className='px-6 py-3'>
													Action
												</th>
											</tr>
										</thead>
										<tbody>
											{filteredExpenses?.map(
												(row, index) =>
													row && (
														<SalesRow
															key={index}
															date={row.created_at}
															amount={row.amount}
															remarks={row.remarks}
															onEdit={handleEdit}
														/>
													)
											)}
										</tbody>
									</table>
									<div className='flex justify-between items-center p-4'>
										<button
											className='btn bg-indigo-500 hover:bg-indigo-600 text-white'
											onClick={() => handleClick(currentPage - 1)}
											disabled={currentPage === 1}>
											Previous
										</button>
										<span>
											Page {currentPage} of {lastPage}
										</span>
										<button
											className={`btn bg-indigo-500 hover:bg-indigo-600 text-white ${
												currentPage === lastPage && "bg-indigo-200"
											}`}
											onClick={() => handleClick(currentPage + 1)}
											disabled={currentPage === lastPage}>
											Next
										</button>
									</div>
								</div>
								{/* End of Daily Sales table */}
							</div>
						</div>
					)}
				</main>
			</div>

			{isExpModalOpen && (
				<ExpEdit
					isOpen={isExpModalOpen}
					expense={selectedExp}
					closeExpModal={closeExpModal}
				/>
			)}

			{isAddModalOpen && (
				<AddExp
					closeAddModal={closeAddModal}
					handleGetExpenses={handleGetExpenses}
					currentPage={currentPage}
				/>
			)}
		</div>
	);
};
