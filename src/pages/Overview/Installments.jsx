import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import { AddExp } from "./Modals/AddExp";
import { AddInstallment } from "./Modals/AddInstallment";
import { InstallmentStatus } from "./Modals/InstallmentStatus";
import { useProductLoad, useInstallmentStore } from "../../store/data";
import { toast } from "sonner";
import { useCredStore } from "../../store/data";
import Datepicker from "../../components/Datepicker";
import jsPDF from "jspdf";
import "jspdf-autotable";

import supabase from "../../lib/supabase";
import { darkScrollbar } from "@mui/material";
import { fetchInstallmentsAndNotify } from "../../utils/notifier";

const debounce = (func, wait) => {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
};

const InstallmentRow = ({ data, fetchInstallments }) => {
	const { cred } = useCredStore();
	const [statusOpen, setStatusOpen] = useState(false);

	const getDateWithSuffix = (date) => {
		const due = new Date(date);
		return due.getDate().toString().padStart(2, "0");
	};
	const handleStatusOpen = () => {
		setStatusOpen(true);
	};

	const closeStatusModal = () => {
		setStatusOpen(false);
	};

	const deleteInstallment = async (id) => {
		const confirmed = confirm(`Are you sure you want to delete the installment?`);

		if (confirmed) {
			try {
				const { err } = await supabase
					.from("months_to_pay")
					.delete()
					.eq("installment_id", id);

				if (err) return;

				const { err: err2 } = await supabase
					.from("installments")
					.delete()
					.eq("id", id);

				if (err2) {
					toast.error(
						"Error deleting installment. Please check your connection and try again"
					);
					return;
				}

				const { err: err3 } = await supabase
					.from("customers")
					.delete()
					.eq("installment_id", id);

				if (err3) {
					toast.error(
						"Error deleting installment. Please check your connection and try again"
					);
					return;
				}

				toast.success("Installment deleted successfully!");
				fetchInstallments();
			} catch (err) {
				console.error(err);
				toast.error("Error deleting installment.");
			}
		} else {
			console.log("Deletion canceled.");
		}
	};

	return (
		<tr className='overflow-auto odd:bg-white even:bg-gray-50 border-b hover:bg-indigo-50'>
			<th className='px-6 py-4 font-medium'>
				{getDateWithSuffix(data?.installment_due)}
			</th>
			<td className='px-6 py-4'>
				{data?.term + " " + (data?.term > 1 ? "months" : "month")}
			</td>
			<td className='sticky left-0 z-[60] px-6 py-4 bg-inherit shadow-lg'>
				{data?.customer_name}
			</td>
			<td className='px-6 py-4'>{data?.customer_full_address}</td>
			<td className='px-6 py-4'>{data?.customer_occupation}</td>
			<td className='px-6 py-4'>
				{new Date(data?.date_released).toLocaleDateString("en-US", {
					month: "long",
					day: "2-digit",
					year: "numeric",
				})}
			</td>
			<td className='px-6 py-4'>{data?.phone}</td>
			<td className='px-6 py-4'>{data?.items?.item_name}</td>
			<td className='px-6 py-4'>{data?.items?.item_imei}</td>
			<td className='px-6 py-4'>{data?.total}</td>
			<td className='px-6 py-4'>{data?.partial_amount_paid}</td>
			<td className='px-6 py-4'>{data?.purple}</td>
			<td className='px-6 py-4'>{data?.yellow}</td>
			<td className='px-6 py-4'>{data?.white}</td>
			<td className='px-6 py-4'>
				{new Date(data?.latest_payment_date).toLocaleDateString("en-US", {
					month: "long",
					day: "2-digit",
					year: "numeric",
				})}
			</td>
			<td className='px-6 py-4'>{data?.trademark}</td>
			<td className='px-6 py-4'>{data?.status}</td>
			{cred.role === "super" && (
				<td className='px-6 py-4'>{data?.branches?.branch_name}</td>
			)}
			<td className='px-6 py-4 flex gap-2'>
				<button
					onClick={handleStatusOpen}
					className='text-blue-600 hover:underline'>
					Check Installment
				</button>
				<button
					onClick={() => deleteInstallment(data?.id)}
					className='bg-red-500 px-2 rounded-md py-1 text-white'>
					Delete
				</button>
			</td>
			{statusOpen && (
				<InstallmentStatus
					installment={data}
					fetchInstallments={fetchInstallments}
					closeStatusModal={closeStatusModal}
				/>
			)}
		</tr>
	);
};

function Installments() {
	const location = useLocation();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalRowsSuper, setTotalRowsSuper] = useState(0);
	const [totalRowsAdmin, setTotalRowsAdmin] = useState(0);
	const [sortType, setSortType] = useState("all");
	const [selectedDate, setSelectedDate] = useState(null);

	const [rowsPerPage] = useState(10000);
	const [isAddInstallModalOpen, setAddInstallModalOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const {
		installments = [],
		setInstallments,
		installmentsForSpecific = [],
		setInstallmentsForSpecific,
	} = useInstallmentStore();
	const { loadProduct } = useProductLoad();
	const { cred } = useCredStore();

	const totalPages =
		cred.role === "super"
			? Math.ceil(totalRowsSuper / rowsPerPage)
			: Math.ceil(totalRowsAdmin / rowsPerPage);

	const today = new Date();

	const handleClick = (newPage) => {
		if (newPage > 0 && newPage <= totalPages) {
			setCurrentPage(newPage);
			fetchInstallments(newPage);
		}
	};

	const handleAddInstallment = () => {
		setAddInstallModalOpen(true);
	};

	const closeAddInstallModal = () => {
		setAddInstallModalOpen(false);
	};

	const fetchInstallmentsByBranch_id = async (page = 1) => {
		try {
			const { data, count, error } = await supabase
				.from("installments")
				.select(
					`
					*, items (id, item_name, item_imei, serial, item_price), 
					months_to_pay (*)
					`,
					{ count: "exact" }
				)
				.eq("branch_id", cred.branch_id)
				.range((page - 1) * rowsPerPage, page * rowsPerPage - 1);

			if (error) {
				console.error("Supabase error (Admin):", error);
				toast.error("Failed to retrieve installments for admin.");
				return;
			}

			const sortedData = filterInstallments(data || [], sortType, selectedDate);
			setInstallmentsForSpecific(sortedData);
			setTotalRowsAdmin(count || 0);
		} catch (err) {
			console.error("Unexpected error (Admin):", err);
			toast.error("An error occurred while fetching installments.");
		}
	};

	const fetchInstallments = async (page = 1) => {
		try {
			const { data, count, error } = await supabase
				.from("installments")
				.select(
					`
					*, items (id, item_name, item_imei, serial, item_price), 
					branches (id, branch_name),
					months_to_pay (*)
					`,
					{ count: "exact" }
				)
				.range((page - 1) * rowsPerPage, page * rowsPerPage - 1);

			if (error) {
				console.error("Supabase error (Super):", error);
				toast.error("Failed to retrieve installments.");
				return;
			}

			const sortedData = filterInstallments(data || [], sortType, selectedDate);
			setInstallments(sortedData);
			setTotalRowsSuper(count || 0);
		} catch (err) {
			console.error("Unexpected error (Super):", err);
			toast.error("An error occurred while fetching installments.");
		}
	};

	const filterInstallments = (installments, sortType, selectedDate) => {
		let filtered = installments;
		if (selectedDate && selectedDate.length === 2) {
			const [startDate, endDate] = selectedDate;
			filtered = filtered.filter((installment) => {
				const installmentDate = new Date(installment.installment_due);
				return installmentDate >= startDate && installmentDate <= endDate;
			});
		}

		if (sortType !== "all") {
			filtered.sort((a, b) => {
				const dateA = new Date(a.installment_due);
				const dateB = new Date(b.installment_due);

				const dayA = dateA.getDate();
				const dayB = dateB.getDate();

				return sortType === "asc" ? dayA - dayB : dayB - dayA;
			});
		}

		return filtered;
	};

	const exportToPDF = () => {
		const doc = new jsPDF({
			orientation: "landscape",
			unit: "mm",
			format: "legal",
			margin: 0.2,
		});
		const tableColumn = [
			"Due",
			"Term",
			"Name",
			"Address",
			"Occupation",
			"Date Released",
			"Phone",
			"Unit",
			"IMEI",
			"Total Payment",
			"Down Payment",
			"Purple",
			"Yellow",
			"White",
			"Due Date",
			"Trademark",
			"Status",
			cred?.credit_role === "super" && "Branch",
		];
		const tableRows = [];

		(cred.role === "super" ? installments : installmentsForSpecific).forEach(
			(installment) => {
				const rowData = [
					new Date(installment.installment_due).toLocaleDateString("en-US", {
						month: "long",
						day: "2-digit",
						year: "numeric",
					}),
					installment.term + "M",
					installment.customer_name,
					installment.customer_full_address,
					installment.customer_occupation,
					new Date(installment.date_released).toLocaleDateString("en-US", {
						month: "long",
						day: "2-digit",
						year: "numeric",
					}),
					installment.phone,
					installment.items?.item_name,
					installment.items?.item_imei,
					installment.total,
					installment.partial_amount_paid,
					installment?.purple,
					installment?.yellow,
					installment?.white,
					new Date(installment.latest_payment_date).toLocaleDateString("en-US", {
						month: "long",
						day: "2-digit",
						year: "numeric",
					}),
					installment.trademark,
					installment.status,
				];

				if (cred.role === "super") {
					rowData.push(installment.branches?.branch_name);
				}

				tableRows.push(rowData);
			}
		);

		doc.autoTable(tableColumn, tableRows, { startY: 20 });
		doc.text("Installments List", 14, 15);
		doc.save("Installments.pdf");
	};

	const getStatusTables = (installments) => {
		const statusTables = {
			green: [],
			white: [],
			purple: [],
			yellow: [],
			blue: [],
			red: [],
		};

		installments.forEach((installment) => {
			const dueDate = new Date(installment.latest_payment_date);
			dueDate.setHours(0, 0, 0, 0);
			today.setHours(0, 0, 0, 0);
			const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
			const { status } = installment;

			 // Extract the day from both dates to compare only the day of the month
			 const installmentDay = dueDate.getDate();
			 const currentDay = today.getDate();
		 
			if (status === "Fully-paid") {
				statusTables.green.push(installment);
			} else if (diffDays > 0 && status === "On-going") {
				statusTables.white.push(installment);
			// Check if the installment is due today (same day regardless of month and year)
			}else if (installmentDay === currentDay && status === "On-going") {
				const paymentDate = new Date(installment.payment_date);
				paymentDate.setHours(0, 0, 0, 0);

				if (paymentDate.getTime() === dueDate.getTime()) {
					// Payment was made on the due date → move to green
					installment.status = "Fully-paid"; // Optional, if needed
					statusTables.green.push(installment);
				} else {
					// Payment not yet made → treat as due today
					statusTables.purple.push(installment);
				}
			} else if (diffDays <= -7 && status === "On-going") {
				statusTables.yellow.push(installment);
			} else if (status === "Deposit") {
				statusTables.blue.push(installment);
			} else if (status === "Remate") {
				statusTables.red.push(installment);
			}
		});

		return statusTables;
	};

	useEffect(() => {
		fetchInstallments(currentPage);
	}, [currentPage]);

	useEffect(() => {
		loadProduct();
	}, []);

	useEffect(() => {
		fetchInstallmentsAndNotify(cred.branch_id);
	}, []);

	const checkStatus = (color) => {
		switch (color) {
			case "green":
				return "Fully paid";
			case "white":
				return "Not yet paid";
			case "purple":
				return "Due Date Now";
			case "yellow":
				return "Lapse within 7 days/For deposit";
			case "blue":
				return "Deposit";
			case "red":
				return "Remate";
		}
	};

	const checkStatusForBackgroundColor = (color) => {
		switch (color) {
			case "green":
				return "bg-green-500";
			case "white":
				return "bg-zinc-500";
			case "purple":
				return "bg-purple-500";
			case "yellow":
				return "bg-yellow-500";
			case "blue":
				return "bg-blue-500";
			case "red":
				return "bg-red-500";
		}
	};

	const renderTable = (data, color) => (
		<div className={`border-l-4  p-4 mb-6 overflow-x-auto`}>
			<h2 className={`text-${color}-500 font-bold mb-2`}>
				{color.charAt(0).toUpperCase() + color.slice(1)}
			</h2>
			<h4>{checkStatus(color)}</h4>
			<table className='w-full text-sm text-gray-500'>
				<thead className={`${checkStatusForBackgroundColor(color)} text-white`}>
					<tr>
						{[
							"Due",
							"Term",
							"Name",
							"Address",
							"Occupation",
							"Date Released",
							"Phone #",
							"Unit",
							"IMEI",
							"Total Payment",
							"Down Payment",
							"Purple",
							"Yellow",
							"White",
							"Trademark",
						].map((heading) => (
							<th className='px-6 py-3'>{heading}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data.length > 0 ? (
						data.map((row, index) => (
							<tr className='odd:bg-white even:bg-gray-50 border-b hover:bg-indigo-50'>
								<th className='px-6 py-4 font-medium'>
									{new Date(row?.latest_payment_date).toLocaleDateString("en-US", {
										month: "long",
										day: "2-digit",
										year: "numeric",
									})}
								</th>
								<td className='px-6 py-4'>
									{row.term + row.term > 1 ? "months" : "month"}
								</td>
								<td className='px-6 py-4'>{row.customer_name}</td>
								<td className='px-6 py-4'>{row.customer_full_address}</td>
								<td className='px-6 py-4'>{row.customer_occupation}</td>
								<td className='px-6 py-4'>
									{new Date(row?.date_released).toLocaleDateString("en-US", {
										month: "long",
										day: "2-digit",
										year: "numeric",
									})}
								</td>
								<td className='px-6 py-4'>{row?.phone}</td>
								<td className='px-6 py-4'>{row?.items?.item_name}</td>
								<td className='px-6 py-4'>{row?.items?.item_imei}</td>
								<td className='px-6 py-4'>{row?.total}</td>
								<td className='px-6 py-4'>{row?.partial_amount_paid}</td>
								<td className='px-6 py-4'>{row?.purple}</td>
								<td className='px-6 py-4'>{row?.yellow}</td>
								<td className='px-6 py-4'>{row?.white}</td>
								<td className='px-6 py-4'>{row?.trademark}</td>
							</tr>
						))
					) : (
						<tr>
							<td
								colSpan='7'
								className='text-center py-4'>
								No records.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);

	const filteredInstallments = filterInstallments(
		cred.role === "super" ? installments : installmentsForSpecific,
		sortType,
		selectedDate
	);

	const statusTables = getStatusTables(
		cred.role === "super" ? installments : installmentsForSpecific
	);

	useEffect(() => {
		if (cred.role === "super") {
			fetchInstallments(currentPage);
		} else if (cred.role === "admin") {
			fetchInstallmentsByBranch_id(currentPage);
		}
	}, [cred.role, currentPage, sortType, selectedDate]);

	useEffect(() => {
		if (location?.state?.installment) setAddInstallModalOpen(true);
	}, [location?.state]);

	const [globalSearchResults, setGlobalSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);

	const performGlobalSearch = async (query) => {
		if (!query.trim()) {
			setGlobalSearchResults([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);
		try {
			const { data, error } = await supabase
				.from("installments")
				.select(
					`
					*,
					items (id, item_name, item_imei, serial, item_price),
					branches (id, branch_name),
					months_to_pay (*)
				`
				)
				.ilike("customer_name", `%${query}%`)
				.limit(5);

			if (!error && (!data || data.length === 0)) {
				const { data: itemData, error: itemError } = await supabase
					.from("installments")
					.select(
						`
						*,
						items!inner (id, item_name, item_imei, serial, item_price),
						branches (id, branch_name),
						months_to_pay (*)
					`
					)
					.ilike("items.item_name", `%${query}%`)
					.limit(5);

				if (!itemError) {
					setGlobalSearchResults(itemData || []);
				}
			} else {
				setGlobalSearchResults(data || []);
			}
		} catch (err) {
			console.error("Search error:", err);
			toast.error("Error performing search");
		} finally {
			setIsSearching(false);
		}
	};

	const debouncedSearch = useCallback(
		debounce((query) => performGlobalSearch(query), 300),
		[]
	);

	const handleSearchChange = (e) => {
		const query = e.target.value;
		setSearchQuery(query);

		if (!query.trim()) {
			if (cred.role === "super") {
				fetchInstallments(currentPage);
			} else {
				fetchInstallmentsByBranch_id(currentPage);
			}
			setGlobalSearchResults([]);
			return;
		}

		debouncedSearch(query);
	};

	const handleSelectResult = (installment) => {
		setGlobalSearchResults([]);
		setSearchQuery(installment.customer_name);
		setInstallments([installment]);
		setInstallmentsForSpecific([installment]);
	};

	const renderSearchInput = () => (
		<div className='relative'>
			<input
				type='text'
				placeholder='Search Name or Unit...'
				value={searchQuery}
				onChange={handleSearchChange}
				className='w-[15.5rem] md:w-[24.5rem] rounded-md border-gray-300 dark:border-none dark:bg-gray-700 pr-10'
			/>

			{searchQuery.trim() && (
				<div className='absolute z-[70] w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border'>
					{globalSearchResults.length > 0 ? (
						globalSearchResults.map((result) => (
							<div
								key={result.id}
								onClick={() => handleSelectResult(result)}
								className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'>
								<div className='font-medium'>{result.customer_name}</div>
								<div className='text-sm text-gray-500'>
									{result.items?.item_name} - {result.items?.item_imei}
								</div>
							</div>
						))
					) : (
						<div className='p-2 text-gray-500 text-center'>
							No Installment Record Found
						</div>
					)}
				</div>
			)}

			{isSearching && (
				<div className='absolute right-3 top-2.5'>
					<svg
						className='animate-spin h-5 w-5 text-gray-400'
						xmlns='http://www.w3.org/2000/svg'
						fill='none'
						viewBox='0 0 24 24'>
						<circle
							className='opacity-25'
							cx='12'
							cy='12'
							r='10'
							stroke='currentColor'
							strokeWidth='4'></circle>
						<path
							className='opacity-75'
							fill='currentColor'
							d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
					</svg>
				</div>
			)}
		</div>
	);

	return (
		<div className='flex h-screen overflow-hidden'>
			<Sidebar
				sidebarOpen={sidebarOpen}
				setSidebarOpen={setSidebarOpen}
			/>
			<div className='relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden'>
				<div className='sticky top-0 z-[100]'>
					<Header
						className='relative z-50'
						sidebarOpen={sidebarOpen}
						setSidebarOpen={setSidebarOpen}
					/>
				</div>
				<main className='relative z-0'>
					<div className='px-4 sm:px-6 lg:px-8 py-8 max-w-9xl mx-auto'>
						<h1 className='text-2xl font-bold mb-5'>
							{cred.role === "super"
								? "Installments from all branches"
								: `Installment from ${cred.branch_name}`}
						</h1>
						<div className='px-4 sm:px-6 lg:px-8 py-8 max-w-9xl mx-auto'>
							<h1 className='text-2xl font-bold mb-5'>Installments</h1>
							<div className='flex flex-row gap-2 justify-between items-start xl:items-center'>
								<div className='relative sm:grid grid-cols-1 md:flex items-center gap-1'>
									{renderSearchInput()}
								</div>
								<div className='sm:grid grid-cols-1 gap-2 lg:flex items-end'>
									<select
										className='w-40 border-gray-300 dark:border-none dark:bg-gray-700 rounded-md'
										onChange={(e) => {
											setSortType(e.target.value);
										}}>
										<option value='asc'>Ascending</option>
										<option value='desc'>Descending</option>
										<option value='all'>Sort by Due Date</option>
									</select>
									{cred.role === "admin" && (
										<button
											onClick={handleAddInstallment}
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
												Add Installment
											</p>
										</button>
									)}
									<div className='flex flex-col gap-1'>
										{/*<h1>Select a date range to filter data</h1>
										<Datepicker
											align='right'
											onDateChange={(dates) => {
												if (Array.isArray(dates) && dates.length === 2) {
													setSelectedDate(dates);
													fetchInstallments(currentPage);
												}
											}}
										/>
										<button
											onClick={() => {
												setSelectedDate([]);
												fetchInstallments(currentPage);
											}}
											className='ml-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded'>
											Clear Date Range
										</button>*/}
									</div>
									<button
										onClick={exportToPDF}
										className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded'>
										Download Installments
									</button>
								</div>
							</div>
						</div>
						<div className='overflow-x-auto shadow-md sm:rounded-lg'>
							<table className='w-full text-sm text-gray-500'>
								<thead className='bg-indigo-500 text-white'>
									<tr>
										<th className='px-6 py-3'>Due</th>
										<th className='px-6 py-3'>Term</th>
										<th className='sticky left-0 z-[60] bg-indigo-500 px-6 py-3 shadow-lg'>
											Name
										</th>
										<th className='px-6 py-3'>Address</th>
										<th className='px-6 py-3'>Occupation</th>
										<th className='px-6 py-3'>Date Released</th>
										<th className='px-6 py-3'>Phone</th>
										<th className='px-6 py-3'>Unit</th>
										<th className='px-6 py-3'>IMEI</th>
										<th className='px-6 py-3'>Total Payment</th>
										<th className='px-6 py-3'>Down Payment</th>
										<th className='px-6 py-3'>Purple</th>
										<th className='px-6 py-3'>Yellow</th>
										<th className='px-6 py-3'>White</th>
										<th className='px-6 py-3'>Due Date</th>
										<th className='px-6 py-3'>Trademark</th>
										<th className='px-6 py-3'>Status</th>
										{cred.role === "super" && <th className='px-6 py-3'>Branch</th>}
										<th className='px-6 py-3'>Action</th>
									</tr>
								</thead>
								<tbody>
									{(cred.role === "super" ? installments : installmentsForSpecific)
										.length > 0 ? (
										(cred.role === "super" ? installments : installmentsForSpecific).map(
											(row, index) => (
												<InstallmentRow
													key={index}
													data={row}
													fetchInstallments={fetchInstallments}
												/>
											)
										)
									) : (
										<tr>
											<td
												colSpan='7'
												className='text-center py-4'>
												No installments yet.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>

						<div className='flex justify-between items-center mt-4'>
							<button
								onClick={() => handleClick(currentPage - 1)}
								disabled={currentPage === 1}
								className={`px-4 py-2 bg-indigo-500 text-white rounded-md ${
									currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
								}`}>
								Previous
							</button>
							<span>
								Page {currentPage} of {totalPages}
							</span>
							<button
								onClick={() => handleClick(currentPage + 1)}
								disabled={currentPage === totalPages}
								className={`px-4 py-2 bg-indigo-500 text-white rounded-md ${
									currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
								}`}>
								Next
							</button>
						</div>
					</div>

					{Object.entries(statusTables).map(([color, data]) =>
						renderTable(data, color)
					)}

					{isAddInstallModalOpen && (
						<AddInstallment
							isOpen={isAddInstallModalOpen}
							closeAddInstallModal={() => setAddInstallModalOpen(false)}
						/>
					)}
				</main>
			</div>
		</div>
	);
}

export default Installments;
