import React, { useState, useEffect } from "react";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import { useProductLoad } from "../../store/data";

import { useCredStore, useSalesStore } from "../../store/data";
import formatMoney from "../../utils/formatMoney";
import supabase from "../../lib/supabase";
import { toast } from "sonner";
import { fetchInstallmentsAndNotify } from "../../utils/notifier";

const SalesRowForSuper = ({
	getSales,
	id,
	date,
	branch_name,
	branch_address,
	customer_name,
	item_name,
	imei,
	amount,
	payment_method,
	collector,
	remarks,
}) => {
	const { cred } = useCredStore();

	const handleDeleteSales = async (id) => {
		const confirmed = confirm(`Are you sure you want to delete this record?`);

		if (confirmed) {
			try {
				const { error } = await supabase.from("sales").delete().eq("id", id);

				if (error) {
					toast.error("Error deleting Sales. Please try again");
					return;
				}

				const { error: logError } = await supabase.from("logs").insert({
					log_label: `${cred.name} deleted a sale record.`,
					log_category: "Action",
					user_id: cred.user_id,
				});

				if (logError) {
					toast.error("Error deleting Sales. Please try again");
					return;
				}
				getSales();
				toast.success("Sales successfully deleted.");
				return;
			} catch (err) {
				toast.error("Error deleting Sales. Please try again");
				return;
			}
		} else {
			toast.warning("Sales deletion canceled.");
			return;
		}
	};

	return (
		<tr className='odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700'>
			<th
				scope='row'
				className='px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white'>
				{new Date(date).toLocaleDateString("en-US", {
					month: "long",
					day: "2-digit",
					year: "numeric",
				})}
			</th>
			<td className='px-6 py-4'>{customer_name}</td>
			<td className='px-6 py-4'>{item_name}</td>
			<td className='px-6 py-4'>{branch_name}</td>
			<td className='px-6 py-4'>{branch_address}</td>
			<td className='px-6 py-4'>{imei}</td>
			<td className='px-6 py-4'>₱{formatMoney(amount)}</td>
			<td className='px-6 py-4'>{payment_method || " "}</td>
			<td className='px-6 py-4'>{collector || " "}</td>
			<td className='px-6 py-4'>{remarks || " "}</td>
			<td className='px-6 py-4'>
				<button
					onClick={() => handleDeleteSales(id)}
					href='#'
					className='bg-red-500 text-white font-medium  px-2 py-1 rounded-md hover:shadow-md hover:duration-100'>
					Delete
				</button>
			</td>
		</tr>
	);
};

const SalesRow = ({
	row,
	getSales,
	id,
	date,
	customer_name,
	item_name,
	imei,
	amount,
	payment_method,
	collector,
	remarks,
}) => {
	const { cred } = useCredStore();

	const handleDeleteSales = async (id) => {
		const confirmed = confirm(`Are you sure you want to delete this record?`);

		if (confirmed) {
			try {
				const { error } = await supabase.from("sales").delete().eq("id", id);

				if (error) {
					toast.error("Error deleting Sales. Please try again");
					return;
				}

				const { error: logError } = await supabase.from("logs").insert({
					log_label: `${cred.name} deleted a sale record.`,
					log_category: "Action",
					user_id: cred.user_id,
				});

				if (logError) {
					toast.error("Error deleting Sales. Please try again");
					return;
				}
				getSales();
				toast.success("Sales successfully deleted.");
				return;
			} catch (err) {
				toast.error("Error deleting Sales. Please try again");
				return;
			}
		} else {
			toast.warning("Sales deletion canceled.");
			return;
		}
	};

	return (
		<tr className='odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700'>
			<th
				scope='row'
				className='px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white'>
				{new Date(date).toLocaleDateString("en-US", {
					month: "long",
					day: "2-digit",
					year: "numeric",
				})}
			</th>
			<td className='px-6 py-4'>{customer_name}</td>
			<td className='px-6 py-4'>{item_name}</td>
			<td className='px-6 py-4'>{imei}</td>
			<td className='px-6 py-4'>₱{formatMoney(amount)}</td>
			<td className='px-6 py-4'>{payment_method || " "}</td>
			<td className='px-6 py-4'>{collector || " "}</td>
			<td className='px-6 py-4'>{remarks || " "}</td>
			<td className='px-6 py-4'>
				<button
					onClick={() => handleDeleteSales(id)}
					href='#'
					className='bg-red-500 text-white font-medium  px-2 py-1 rounded-md hover:shadow-md hover:duration-100'>
					Delete
				</button>
			</td>
		</tr>
	);
};

const DailySales = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [total, setTotal] = useState(0);
	const [currentPage, setCurrentPage] = useState(1);
	const [currentPageForSuper, setCurrentPageForSuper] = useState(1);
	const [lastPage, setLastPage] = useState(0);
	const [lastPageForSuper, setLastPageForSuper] = useState(0);
	const [sales, setSales] = useState({});
	const ITEMS_PER_PAGE = 6;
	const {
		totalSales,
		setTotalSales,
		totalSalesPerBranch,
		setTotalSalesPerBranch,
	} = useSalesStore();
	const [filteredData, setFilteredData] = useState([]);
	const [filteredDataForSuper, setFilteredDataForSuper] = useState([]);
	const [salesForSuper, setSalesForSuper] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [searchTermForSuper, setSearchTermForSuper] = useState("");
	const [selectedDate, setSelectedDate] = useState(null);
	const { cred } = useCredStore();
	const { loadProduct } = useProductLoad();

	const getDailySalesFromAllBranches = async () => {
		try {
			const { data: sales, error: salesError } = await supabase
				.from("sales")
				.select("*");

			if (salesError) {
				console.error(salesError);
				toast.error("Error getting all sales");
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

			const groupedByBranch = sales.reduce((acc, sale) => {
				if (!acc[sale.branch_id]) {
					acc[sale.branch_id] = {
						branch_id: sale.branch_id,
						branch_name: branchLookup[sale.branch_id] || null,
						total_sales: 0,
					};
				}

				acc[sale.branch_id].total_sales += sale.amount;

				return acc;
			}, {});

			const groupedDataArray = Object.values(groupedByBranch);

			setTotalSalesPerBranch(groupedDataArray);
		} catch (err) {
			console.error(err);
			throw new Error("Error retrieving sales");
		}
	};

	const getTotalProfit = async () => {
		try {
			const { data, error } = await supabase.from("sales").select("*");

			if (error) {
				toast.error(
					"Error getting total sales from all branches. Check your internet connection and try again."
				);
				return;
			}

			const totalSales = data.reduce((acc, curr) => acc + curr.amount, 0);
			setTotal(totalSales);
		} catch (err) {
			console.error(err);
			throw new Error("Error retrieving sales");
		}
	};

	/**THIS IS FOR SUPER ADMIN ===================== */

	const getSalesForSuper = async (page = 1) => {
		try {
			const salesQuery = supabase
				.from("sales")
				.select(`*, branch_id, branches (branch_name, branch_address)`)
				.order("created_at", { ascending: false })
				.range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);

			const { data: sales, error: salesError } = await salesQuery;

			if (salesError) {
				console.error(salesError);
				toast.error("Error retrieving sales data");
				return;
			}

			const { data: installments, error: installmentsError } = await supabase
				.from("installments")
				.select("*");

			if (installmentsError) {
				console.error(installmentsError);
				toast.error("Error retrieving installments data");
				return;
			}

			const { data: purchases, error: purchasesError } = await supabase
				.from("direct_purchases")
				.select("*");

			if (purchasesError) {
				console.error(purchasesError);
				toast.error("Error retrieving purchases data");
				return;
			}

			const { data: direct_purchase_items, error: directPurchaseItemsError } =
				await supabase.from("direct_purchase_items").select("*");

			if (directPurchaseItemsError) {
				console.error(directPurchaseItemsError);
				toast.error("Error retrieving direct purchase items data");
				return;
			}

			const { data: items, error: itemsError } = await supabase
				.from("items")
				.select("*");

			if (itemsError) {
				console.error(itemsError);
				toast.error("Error retrieving items data");
				return;
			}

			const directPurchaseItemsId = direct_purchase_items.map(
				(item) => item.item_id
			);

			const combinedSales = sales.map((sale) => {
				const installment =
					installments.find((inst) => inst.id === sale.installment_id) || {};
				const purchase = purchases.find((pur) => pur.id === sale.purchase_id) || {};
				const item =
					items.find(
						(i) =>
							i.id === installment.item_id || directPurchaseItemsId.includes(i.id)
					) || {};

				return {
					...sale,
					installment,
					purchase,
					item,
				};
			});

			const { count } = await supabase
				.from("sales")
				.select("id", { count: "exact" })
				.eq("branch_id", cred.branch_id);

			const lastPage = Math.ceil(count / ITEMS_PER_PAGE);

			setLastPageForSuper(lastPage);
			setSalesForSuper(combinedSales);
			setFilteredDataForSuper(combinedSales);
		} catch (err) {
			console.error(err);
			throw new Error("Error retrieving sales");
		}
	};

	/**========================================= */

	/**THIS IS FOR ADMIN ===================== */

	const getSales = async (page = 1) => {
		const today = new Date();
		const startOfDay = new Date(today.setHours(0, 0, 0, 0));
		const endOfDay = new Date(today.setHours(24, 0, 0, 0));

		try {
			const salesQuery = supabase
				.from("sales")
				.select(`*, branch_id, branches (branch_name)`)
				.order("created_at", { ascending: false })
				.range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)
				.eq("branch_id", cred.branch_id);

			const { data: sales, error: salesError } = await salesQuery;

			if (salesError) {
				console.error(salesError);
				toast.error("Error retrieving sales data");
				return;
			}

			const installmentIds = sales
				.map((sale) => sale.installment_id)
				.filter(Boolean);
			const purchaseIds = sales.map((sale) => sale.purchase_id).filter(Boolean);

			const { data: installments, error: installmentsError } = await supabase
				.from("installments")
				.select("*")
				.in("id", installmentIds);

			if (installmentsError) {
				console.error(installmentsError);
				toast.error("Error retrieving installment data");
				return;
			}

			const { data: purchases, error: purchasesError } = await supabase
				.from("direct_purchases")
				.select("*")
				.in("id", purchaseIds);

			if (purchasesError) {
				console.error(purchasesError);
				toast.error("Error retrieving purchase data");
				return;
			}

			const { data: direct_purchase_items, error: directPurchaseItemsError } =
				await supabase
					.from("direct_purchase_items")
					.select("*")
					.in("direct_purchase_id", purchaseIds);

			const itemIds = [
				...new Set([
					...installments.map((installment) => installment.item_id),
					...direct_purchase_items.map((item) => item.item_id),
				]),
			];

			const { data: items, error: itemsError } = await supabase
				.from("items")
				.select("*")
				.in("id", itemIds);

			if (itemsError) {
				console.error(itemsError);
				toast.error("Error retrieving item data");
				return;
			}

			const directPurchaseItemsId = direct_purchase_items.map(
				(item) => item.item_id
			);

			const combinedSales = sales.map((sale) => {
				const installment =
					installments.find((inst) => inst.id === sale.installment_id) || {};
				const purchase = purchases.find((pur) => pur.id === sale.purchase_id) || {};
				const item =
					items.find(
						(i) =>
							i.id === installment.item_id || directPurchaseItemsId.includes(i.id)
					) || {};

				return {
					...sale,
					installment,
					purchase,
					item,
				};
			});

			const { count } = await supabase
				.from("sales")
				.select("id", { count: "exact" })
				.eq("branch_id", cred.branch_id);

			const lastPage = Math.ceil(count / ITEMS_PER_PAGE);

			//total income
			const { data } = await supabase
				.from("sales")
				.select("*")
				.eq("branch_id", cred.branch_id);

			const { data: data2, error } = await supabase
				.from("sales")
				.select("*")
				.eq("branch_id", cred.branch_id)
				.gte("created_at", startOfDay.toISOString())
				.lt("created_at", endOfDay.toISOString());

			if (error) {
				console.error("Error fetching daily sales:", error);
			}

			const totalSales = data.reduce((acc, curr) => acc + curr.amount, 0);
			const dailySales = data2.reduce((acc, curr) => acc + curr.amount, 0);

			setSales({
				daily_income: dailySales,
				total_income: totalSales,
			});
			setLastPage(lastPage);
			setFilteredData(combinedSales);
			setTotalSales(combinedSales);
		} catch (err) {
			console.error(err);
			throw new Error("Error retrieving sales");
		}
	};

	const handlePageChangeForSuper = (page) => {
		setCurrentPageForSuper(page);
		getSalesForSuper(page);
	};

	const handlePageChange = (page) => {
		setCurrentPage(page);
		getSales(page);
	};

	/**
		* 
		For super filtering
		
	 */

	const handleSearchChangeForSuper = (e) => {
		const value = e.target.value.toLowerCase();
		setSearchTermForSuper(value);

		if (value === "") {
			setFilteredDataForSuper(salesForSuper);
			return;
		}

		const filtered = salesForSuper.filter((sale) => {
			const itemName = sale.item?.item_name?.toLowerCase() || "";
			const customerName =
				sale?.purchase?.customer_name?.toLowerCase() ||
				sale?.installment?.customer_name?.toLowerCase() ||
				"";
			const amountString = sale.amount.toString();
			const branchName = sale.branches.branch_name?.toLowerCase();

			return (
				itemName.includes(value) ||
				amountString.includes(value) ||
				customerName.includes(value) ||
				branchName.includes(value)
			);
		});
		setFilteredDataForSuper(filtered);
	};

	/** */
	const handleSearchChange = (e) => {
		const value = e.target.value;
		setSearchTerm(value);

		if (value === "") {
			setFilteredData(totalSales);
			return;
		}

		const filtered = totalSales.filter((sale) => {
			const itemName = sale.item?.item_name?.toLowerCase() || "";
			const customerName =
				sale?.purchase?.customer_name?.toLowerCase() ||
				sale?.installment?.customer_name?.toLowerCase() ||
				"";
			const amountString = sale.amount.toString();

			return (
				itemName.includes(value.toLowerCase()) ||
				amountString.includes(value) ||
				customerName.includes(value.toLowerCase())
			);
		});

		setFilteredData(filtered);
	};

	const handleDateChange = (date) => {
		setSelectedDate(date);
	
		if (date) {
			if (cred.role === "admin") {
				const filtered = totalSales.filter((sale) => {
					const saleDate = new Date(sale.created_at);
					return (
						saleDate.getFullYear() === date.getFullYear() &&
						saleDate.getMonth() === date.getMonth() &&
						saleDate.getDate() === date.getDate()
					);
				});
				setFilteredData(filtered);
			} else if (cred.role === "super") {
				const filtered = salesForSuper.filter((sale) => {
					const saleDate = new Date(sale.created_at);
					return (
						saleDate.getFullYear() === date.getFullYear() &&
						saleDate.getMonth() === date.getMonth() &&
						saleDate.getDate() === date.getDate()
					);
				});
				setFilteredDataForSuper(filtered);
			}
		} else {
			if (cred.role === "admin") {
				setFilteredData(totalSales);
			} else if (cred.role === "super") {
				setFilteredDataForSuper(salesForSuper);
			}
		}
	};

	useEffect(() => {
		if (cred.role === "admin") getSales(currentPage);
	}, [cred, currentPage]);

	useEffect(() => {
		if (cred.role === "super") getSalesForSuper(currentPageForSuper);
	}, [cred, currentPageForSuper]);

	useEffect(() => {
		if (cred.role === "super") {
			getDailySalesFromAllBranches();
			getTotalProfit();
		}
	}, [cred]);

	useEffect(() => {
		loadProduct();
	}, [loadProduct]);

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
					<div className='px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto'>
						{cred.role === "super" && (
							<>
								<div className='flex flex-col xl:flex-row justify-between items-start xl:items-center'>
									<h1 className='flex flex-col text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-5'>
										Overall Sales
										<p className='text-base font-normal'>
											Here's your overall sales from all of your branches.
										</p>
									</h1>
								</div>
								<div className='grid grid-cols-2 gap-6'>
									{/* Total sales from all branches */}
									<div className='p-4 flex gap-8 col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700'>
										<svg
											class='w-[80px] h-[80px] text-black dark:text-white'
											aria-hidden='true'
											xmlns='http://www.w3.org/2000/svg'
											width='24'
											height='24'
											fill='none'
											viewBox='0 0 24 24'>
											<path
												stroke='currentColor'
												stroke-linecap='round'
												stroke-linejoin='round'
												stroke-width='1'
												d='M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7h-1M8 7h-.688M13 5v4m-2-2h4'
											/>
										</svg>
										<div className='flex flex-col gap-4'>
											<h1 className='text-xl font-bold text-slate-800 dark:text-slate-100 mr-2'>
												Total Sales from all branches
											</h1>
											<h2 className='text-4xl font-semibold text-slate-500 dark:text-slate-100'>
												{" "}
												₱ {formatMoney(total)}
											</h2>
										</div>
									</div>
									{/* Daily sales from each branches */}
									<div className='col-span-full xl:col-span-6 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700'>
										<header className='px-5 py-4 border-b border-slate-100 dark:border-slate-700'>
											<h2 className='font-semibold text-slate-800 dark:text-slate-100'>
												Daily Sales from all Branches
											</h2>
										</header>
										<div className='p-3'>
											<div>
												<header className='text-xs uppercase text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 dark:bg-opacity-50 rounded-sm font-semibold p-2'>
													Today
												</header>
												{totalSalesPerBranch ? (
													totalSalesPerBranch?.map((res, idx) => {
														return (
															<ul
																key={idx}
																className='my-1'>
																<li className='flex px-2'>
																	<div className='w-9 h-9 rounded-full shrink-0 my-2 mr-3 bg-emerald-500'>
																		<svg
																			className='w-9 h-9 fill-current text-rose-50'
																			viewBox='0 0 36 36'>
																			<path d='M17.7 24.7l1.4-1.4-4.3-4.3H25v-2H14.8l4.3-4.3-1.4-1.4L11 18z' />
																		</svg>
																	</div>
																	<div className='grow flex items-center border-b border-slate-100 dark:border-slate-700 text-sm py-2'>
																		<div className='grow flex justify-between'>
																			<div className='self-center'>
																				<a
																					className='font-medium text-slate-800 hover:text-slate-900 dark:text-slate-100 dark:hover:text-white'
																					href='#0'>
																					{res.branch_name}
																				</a>{" "}
																			</div>
																			<div className='shrink-0 self-start ml-2'>
																				<span
																					className={`font-medium ${
																						res.sales_id && "text-emerald-500"
																					}`}>
																					₱ {formatMoney(res?.total_sales)}
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
								</div>
								<div className='flex flex-col gap-2 mt-10'>
									<div className='flex flex-col xl:flex-row justify-between items-start xl:items-center'>
										<h1 className='flex flex-col text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-5'>
											Sales
											<p className='text-base font-normal'>
												Here's Your Sales Overview from all of your branches.
											</p>
										</h1>
										<div className='flex gap-4 items-center'>
										<input
											type='date'
											id='date'
											name='date'
											value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
											onChange={(e) => {
												const dateValue = e.target.value ? new Date(e.target.value) : null;
												handleDateChange(dateValue);
											}}
											className='border rounded-md p-2'
										/>
										</div>
									</div>
									<div className='shadow-xl rounded-2xl bg-white dark:bg-slate-800 p-8 sm:flex-col sm:justify-between sm:items-center mb-8'>
										<div className='sm:flex sm:justify-between sm:items-center mb-8'>
											<h1 className='text-2xl font-bold'>All Sales</h1>
											<div className='flex gap-2 items-center'>
												<div className='relative'>
													<input
														type='text'
														placeholder='Search Sales by Customer Name, Branch Name, Item Name, or Amount paid'
														value={searchTermForSuper}
														onChange={(e) => handleSearchChangeForSuper(e)}
														className='w-[18.5rem] md:w-[40.5rem] rounded-md border-gray-300 dark:border-none dark:bg-gray-700 pr-10'
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
											</div>
										</div>
										{/* All Sales table */}
										<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
											<table className='w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400'>
												<thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
													<tr>
														{[
															"Date Collected",
															"Customer Name",
															"Item Name",
															"Branch Name",
															"Branch Address",
															"IMEI",
															"Amount",
															"Payment Method",
															"Collector",
															"Remarks",
															"Action",
														].map((heading, index) => (
															<th
																key={index}
																scope='col'
																className='px-6 py-3'>
																{heading}
															</th>
														))}
													</tr>
												</thead>
												<tbody>
													{filteredDataForSuper?.map((row, index) => (
														<SalesRowForSuper
															branch_name={row.branches.branch_name}
															branch_address={row.branches.branch_address}
															getSales={getSales}
															key={index}
															id={row.id}
															date={row.created_at}
															customer_name={
																row?.purchase?.customer_name ?? row?.installment?.customer_name
															}
															item_name={row.item?.item_name ?? row.item?.item_name}
															imei={row.item?.item_imei ?? "N/A"}
															amount={row.amount}
															payment_method={row.payment_method}
															collector={
																row.purchase.collector_name ?? row.installment?.collector_name
															}
															remarks={row.purchase.remarks ?? row.installment?.remarks}
														/>
													))}
												</tbody>
											</table>
											<div className='flex justify-between items-center mt-4'>
												<button
													onClick={() => handlePageChangeForSuper(currentPageForSuper - 1)}
													disabled={currentPageForSuper === 1}
													className={`px-4 py-2 text-sm font-medium ${
														currentPageForSuper === 1 ? "text-gray-300" : "text-indigo-600"
													}`}>
													Previous
												</button>
												<span>
													Page {currentPageForSuper} of {lastPage}
												</span>
												<button
													onClick={() => handlePageChangeForSuper(currentPageForSuper + 1)}
													disabled={currentPageForSuper === lastPage}
													className={`px-4 py-2 text-sm font-medium ${
														currentPage === lastPage ? "text-gray-300" : "text-indigo-600"
													}`}>
													Next
												</button>
											</div>
										</div>
									</div>
								</div>
							</>
						)}

						{cred.role === "admin" && (
							<>
								<div className='flex flex-col xl:flex-row justify-between items-start xl:items-center'>
									<h1 className='flex flex-col text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-5'>
										Sales
										<p className='text-base font-normal'>Here's Your Sales Overview.</p>
									</h1>
									{/* Daily Sales overview */}
									<div className='flex flex-col md:flex-row gap-0 md:gap-6'>
										<div className='flex gap-4 items-center p-6 rounded-2xl shadow-lg bg-indigo-500 text-white max-w-[25.5rem] mb-3 md:mb-6'>
											<svg
												class='w-[80px] h-[80px] text-white'
												aria-hidden='true'
												xmlns='http://www.w3.org/2000/svg'
												width='24'
												height='24'
												fill='none'
												viewBox='0 0 24 24'>
												<path
													stroke='currentColor'
													stroke-linecap='round'
													stroke-linejoin='round'
													stroke-width='1'
													d='M5 4h1.5L9 16m0 0h8m-8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm8 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8.5-3h9.25L19 7h-1M8 7h-.688M13 5v4m-2-2h4'
												/>
											</svg>
											<div className='flex flex-col font-bold'>
												<h1 className='text-3xl'>
													₱{sales?.daily_income ? formatMoney(sales?.daily_income) : 0}
												</h1>
												<p>Daily Income</p>
											</div>
										</div>
										<div className='flex gap-4 items-center p-6 rounded-2xl shadow-lg bg-indigo-500 text-white max-w-[25.5rem] mb-6'>
											<svg
												className='w-[80px] h-6text-white'
												aria-hidden='true'
												xmlns='http://www.w3.org/2000/svg'
												fill='none'
												viewBox='0 0 24 24'>
												<path
													stroke='currentColor'
													stroke-linecap='round'
													stroke-width='1'
													d='M8 7V6a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1M3 18v-7a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Zm8-3.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z'
												/>
											</svg>
											<div className='flex flex-col font-bold'>
												{typeof sales?.total_income === "number" && (
													<h1 className='text-4xl'>
														₱{sales ? formatMoney(sales?.total_income) : 0}
													</h1>
												)}
												<p>Total Income</p>
											</div>
										</div>
									</div>
								</div>
								<div className='shadow-xl rounded-2xl bg-white dark:bg-slate-800 p-8 sm:flex-col sm:justify-between sm:items-center mb-8'>
									<div className='sm:flex sm:justify-between sm:items-center mb-8'>
										<h1 className='text-2xl font-bold'>All Sales</h1>
										<div className='flex gap-2 items-center'>
											<div className='relative'>
												<input
													type='text'
													placeholder='Search Sales by Customer Name, Item Name, or Amount paid'
													value={searchTerm}
													onChange={(e) => handleSearchChange(e)}
													className='w-[18.5rem] md:w-[40.5rem] rounded-md border-gray-300 dark:border-none dark:bg-gray-700 pr-10'
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
											<div className='flex gap-4 items-center'>
											<input
												type='date'
												id='date'
												name='date'
												value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
												onChange={(e) => {
													const dateValue = e.target.value ? new Date(e.target.value) : null;
													handleDateChange(dateValue);
												}}
												className='border rounded-md p-2'
											/>
											</div>
										</div>
									</div>
									{/* Daily Sales table */}
									<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
										<table className='w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400'>
											<thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
												<tr>
													{[
														"Date Collected",
														"Customer Name",
														"Item Name",
														"IMEI",
														"Amount",
														"Payment Method",
														"Collector",
														"Remarks",
														"Action",
													].map((heading, index) => (
														<th
															key={index}
															scope='col'
															className='px-6 py-3'>
															{heading}
														</th>
													))}
												</tr>
											</thead>
											<tbody>
												{filteredData?.map((row, index) => (
													<SalesRow
														row={row}
														getSales={getSales}
														key={index}
														id={row.id}
														date={row.purchase.created_at ?? row.installment.created_at}
														customer_name={
															row?.purchase?.customer_name ?? row?.installment?.customer_name
														}
														item_name={row.item?.item_name ?? row.item?.item_name}
														imei={row?.item?.item_imei ?? "N/A"}
														amount={
															row.purchase.amount ?? row.installment?.partial_amount_paid
														}
														payment_method={row.purchase.payment_method ?? "Cash"}
														collector={
															row.purchase.collector_name ?? row.installment?.collector_name
														}
														remarks={row.purchase.remarks ?? row.installment?.remarks}
													/>
												))}
											</tbody>
										</table>
										<div className='flex justify-between items-center mt-4'>
											<button
												onClick={() => handlePageChange(currentPage - 1)}
												disabled={currentPage === 1}
												className={`px-4 py-2 text-sm font-medium ${
													currentPage === 1 ? "text-gray-300" : "text-indigo-600"
												}`}>
												Previous
											</button>
											<span>
												Page {currentPage} of {lastPage}
											</span>
											<button
												onClick={() => handlePageChange(currentPage + 1)}
												disabled={currentPage === lastPage}
												className={`px-4 py-2 text-sm font-medium ${
													currentPage === lastPage ? "text-gray-300" : "text-indigo-600"
												}`}>
												Next
											</button>
										</div>
									</div>
								</div>
							</>
						)}
					</div>
				</main>
			</div>
		</div>
	);
};

export default DailySales;
