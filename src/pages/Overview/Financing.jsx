import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import { InstallmentStatus } from "./Modals/InstallmentStatus";
import { useProductLoad, useFinancingStore } from "../../store/data";
import { toast } from "sonner";
import { useCredStore } from "../../store/data";
import Datepicker from "../../components/Datepicker";
import jsPDF from "jspdf";
import "jspdf-autotable";

import supabase from "../../lib/supabase";
import { fetchInstallmentsAndNotify } from "../../utils/notifier";
import { AddFinancing } from "./Modals/AddFinancing";

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

const FinancingRow = ({ data, fetchFinance }) => {
	const { cred } = useCredStore();
	const [statusOpen, setStatusOpen] = useState(false);

	const getDateWithSuffix = (date) => {
		const due = new Date(date);
		const day = due.getDate();

		const getOrdinalSuffix = (n) => {
			if (n >= 11 && n <= 13) return `${n}th`;
			const lastDigit = n % 10;
			switch (lastDigit) {
				case 1:
					return `${n}st`;
				case 2:
					return `${n}nd`;
				case 3:
					return `${n}rd`;
				default:
					return `${n}th`;
			}
		};

		return getOrdinalSuffix(day);
	};

	const handleDeleteFinancingRecord = async (id) => {
		const confirmed = window.confirm(
			"Are you sure you want to delete this financing record?"
		);
		if (!confirmed) {
			return;
		}

		try {
			const { error } = await supabase.from("financing").delete().eq("id", id);

			if (error) {
				toast.error("Error deleting financing record");
				console.error("Error deleting financing record:", error);
				return;
			}

			toast.success("Financing record deleted successfully.");
			fetchFinance();
		} catch (error) {
			toast.error("Error deleting financing record");
			console.error("Error deleting financing record:", error);
		}
	};

	const closeStatusModal = () => {
		setStatusOpen(false);
	};

	return (
		<tr className='overflow-auto odd:bg-white even:bg-gray-50 border-b hover:bg-indigo-50'>
			<td className='px-6 py-4'>{data?.financing}</td>
			<th className='px-6 py-4 font-medium'>
				{getDateWithSuffix(data?.installment_due)}
			</th>
			<td className='px-6 py-4'>{data?.term + "M"}</td>
			<td className='px-6 py-4'>{data?.customer_name}</td>
			<td className='px-6 py-4'>{data?.customer_full_address}</td>
			<td className='px-6 py-4'>{data?.customer_occupation}</td>
			<td className='px-6 py-4'>
				{new Date(data?.date_released).toLocaleDateString("en-US", {
					month: "long",
					day: "2-digit",
					year: "numeric",
				})}
			</td>
			<td className='px-6 py-4'>
				{new Date(data?.installment_due).toLocaleDateString("en-US", {
					month: "long",
					day: "2-digit",
					year: "numeric",
				})}
			</td>
			<td className='px-6 py-4'>{data?.phone_number}</td>
			<td className='px-6 py-4'>{data?.items?.item_name}</td>
			<td className='px-6 py-4'>{data?.items?.item_imei}</td>
			<td className='px-6 py-4'>{data?.total}</td>
			<td className='px-6 py-4'>{data?.partial_amount_paid}</td>
			<td className='px-6 py-4'>{data?.purple}</td>
			<td className='px-6 py-4'>{data?.yellow}</td>
			<td className='px-6 py-4'>{data?.white}</td>
			<td className='px-6 py-4'>{data?.trademark}</td>
			{cred.role === "super" && (
				<td className='px-6 py-4'>{data?.branches?.branch_name}</td>
			)}
			<td className='px-6 py-4'>{data?.status}</td>
			<td className='px-6 py-4'>
				<button
					onClick={() => handleDeleteFinancingRecord(data?.id)}
					className='btn bg-red-500 hover:bg-red-600 text-white'>
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

function Financing() {
	const location = useLocation();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalRowsSuper, setTotalRowsSuper] = useState(0);
	const [totalRowsAdmin, setTotalRowsAdmin] = useState(0);
	const [sortType, setSortType] = useState("all");
	const [selectedDate, setSelectedDate] = useState(null);
	const [isAddFinancing, setIsAddFinancing] = useState(false);

	const [rowsPerPage] = useState(30);
	const [searchQuery, setSearchQuery] = useState("");
	const {
		financing = [],
		setFinancing,
		financingForSpecific = [],
		setFinancingForSpecific,
	} = useFinancingStore();
	const { loadProduct } = useProductLoad();
	const { cred } = useCredStore();

	const [globalSearchResults, setGlobalSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);

	const totalPages =
		cred.role === "super"
			? Math.ceil(totalRowsSuper / rowsPerPage)
			: Math.ceil(totalRowsAdmin / rowsPerPage);

	const today = new Date();

	const handleClick = (newPage) => {
		if (newPage > 0 && newPage <= totalPages) {
			setCurrentPage(newPage);
		}
	};

	const fetchFinancingByBranchId = async (page = 1, branch_id) => {
		try {
			const { data, count, error } = await supabase
				.from("financing")
				.select(
					`
						*, items (id, item_name, item_imei, serial, item_price)
					`,
					{ count: "exact" }
				)
				.eq("branch_id", branch_id) // Filter by branch
				.order("installment_due", { ascending: true })
				.range((page - 1) * rowsPerPage, page * rowsPerPage - 1);

			if (error) {
				console.error("Supabase error (Admin):", error);
				toast.error("Failed to retrieve financing for admin.");
				return;
			}

			setFinancingForSpecific(data || []);
			setTotalRowsAdmin(count || 0); // Update total rows for admin
		} catch (err) {
			console.error("Unexpected error (Admin):", err);
			toast.error("An error occurred while fetching financing data.");
		}
	};

	//all financing data
	const fetchFinancing = async (page = 1) => {
		try {
			const { data, count, error } = await supabase
				.from("financing")
				.select(
					`
						*, items (id, item_name, item_imei, serial, item_price), 
						branches (id, branch_name)
					`,
					{ count: "exact" }
				)
				.order("installment_due", { ascending: true })
				.range((page - 1) * rowsPerPage, page * rowsPerPage - 1);

			if (error) {
				console.error("Supabase error (Super):", error);
				toast.error("Failed to retrieve financing data.");
				return;
			}

			setFinancing(data || []);
			setTotalRowsSuper(count || 0); // Update total rows for super user
		} catch (err) {
			console.error("Unexpected error (Super):", err);
			toast.error("An error occurred while fetching financing data.");
		}
	};

	// Improved filtering method
	const filterFinancing = (financing, sortType, selectedDate) => {
		let filtered = financing.filter(
			(finance) =>
				finance.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				finance.items.item_name.toLowerCase().includes(searchQuery.toLowerCase())
		);

		// Filter by selected date if it exists
		if (selectedDate && selectedDate.length > 0) {
			const startDate = selectedDate[0];
			const endDate = selectedDate[1] || startDate; // If end date is not selected, use start date
			filtered = filtered.filter((finance) => {
				const installmentDate = new Date(finance.installment_due);
				return installmentDate >= startDate && installmentDate <= endDate;
			});
		}

		// Sort the filtered installments based on the sortType
		if (sortType === "asc") {
			filtered.sort(
				(a, b) => new Date(a.installment_due) - new Date(b.installment_due)
			);
		} else if (sortType === "desc") {
			filtered.sort(
				(a, b) => new Date(b.installment_due) - new Date(a.installment_due)
			);
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
			"Financing",
			"Due",
			"Term",
			"Name",
			"Address",
			"Occupation",
			"Date Released",
			"Due Date",
			"Phone",
			"Unit",
			"IMEI",
			"Total Payment",
			"Partial Payment",
			"Purple",
			"Yellow",
			"White",
			"Trademark",
			"Status",
			cred.credit_role === "super" && "Branch",
		];
		const tableRows = [];

		filterFinancing.forEach((installment) => {
			const rowData = [
				installment.financing,
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
				installment.phone_number,
				installment.items?.item_name,
				installment.items?.item_imei,
				installment.total,
				installment.partial_amount_paid,
				installment.months_to_pay[0]?.purple,
				installment.months_to_pay[0]?.yellow,
				installment.months_to_pay[0]?.white,
				new Date(installment.installment_due).toLocaleDateString("en-US", {
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
		});

		doc.autoTable(tableColumn, tableRows, { startY: 20 });
		doc.text("Installments With Financing List", 14, 15);
		doc.save("Installments-with-financing.pdf");
	};

	const performGlobalSearch = async (query) => {
		if (!query.trim()) {
			setGlobalSearchResults([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);
		try {
			const { data, error } = await supabase
				.from("financing")
				.select(
					`
					*,
					items (id, item_name, item_imei, serial, item_price),
					branches (id, branch_name)
				`
				)
				.ilike("customer_name", `%${query}%`)
				.limit(5);

			// If no results found by customer name, try searching by item name
			if (!error && (!data || data.length === 0)) {
				const { data: itemData, error: itemError } = await supabase
					.from("financing")
					.select(
						`
						*,
						items!inner (id, item_name, item_imei, serial, item_price),
						branches (id, branch_name)
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
				fetchFinancing(currentPage);
			} else {
				fetchFinancingByBranchId(currentPage, cred.branch_id);
			}
			setGlobalSearchResults([]);
			return;
		}

		debouncedSearch(query);
	};

	const handleSelectResult = (finance) => {
		setGlobalSearchResults([]);
		setSearchQuery(finance.customer_name);
		setFinancing([finance]);
		setFinancingForSpecific([finance]);
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

			{/* Search Results Dropdown - Show either results or "No Results" message */}
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
							No financing records found
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

	useEffect(() => {
		loadProduct();
	}, []);

	useEffect(() => {
		fetchInstallmentsAndNotify(cred.branch_id);
	}, []);

	const filteredFinancing = filterFinancing(
		cred.role === "super" ? financing : financingForSpecific,
		sortType,
		selectedDate
	);

	useEffect(() => {
		if (cred.role === "super") {
			fetchFinancing(currentPage);
		}

		if (cred.role === "admin") {
			fetchFinancingByBranchId(currentPage, cred.branch_id);
		}
	}, [cred.role, currentPage]);

	return (
		<div className='flex h-screen overflow-hidden'>
			<Sidebar
				sidebarOpen={sidebarOpen}
				setSidebarOpen={setSidebarOpen}
			/>
			<div className='relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden'>
				<Header
					sidebarOpen={sidebarOpen}
					setSidebarOpen={setSidebarOpen}
				/>
				<main>
					<div className='py-8 px-6 max-w-9xl mx-auto'>
						<h1 className='text-2xl font-bold mb-5'>Financing</h1>
						<div className='max-w-9xl mx-auto'>
							<div className='my-4 flex flex-row gap-2 justify-between items-start xl:items-center'>
								<div className='relative sm:grid grid-cols-1 md:flex items-center gap-1'>
									{renderSearchInput()}
								</div>
								<div className='sm:grid grid-cols-1 gap-2 lg:flex items-end'>
									<select
										className='w-40 border-gray-300 dark:border-none dark:bg-gray-700 rounded-md'
										onChange={(e) => {
											setSortType(e.target.value);
										}}>
										<option value='all'>Sort by Due Date</option>
										<option value='asc'>Ascending</option>
										<option value='desc'>Descending</option>
									</select>

									<div className='flex flex-col gap-1'>
										<h1>Sort by specific date</h1>
										<Datepicker
											align='right'
											onDateChange={(dates) => setSelectedDate(dates)}
										/>
									</div>
									{cred.role === "admin" && (
										<button
											onClick={() => setIsAddFinancing(true)}
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
												Add Record
											</p>
										</button>
									)}
									<button
										onClick={exportToPDF}
										className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded'>
										Download data in PDF format
									</button>
								</div>
							</div>
						</div>
						{/* Main Installments Table */}
						<div className='overflow-x-auto shadow-md sm:rounded-lg'>
							<table className='w-full text-sm text-gray-500'>
								<thead className='bg-indigo-500 text-white'>
									<tr>
										<th className='px-6 py-3'>Financing</th>
										<th className='px-6 py-3'>Due</th>
										<th className='px-6 py-3'>Term</th>
										<th className='px-6 py-3'>Name</th>
										<th className='px-6 py-3'>Address</th>
										<th className='px-6 py-3'>Occupation</th>
										<th className='px-6 py-3'>Date Released</th>
										<th className='px-6 py-3'>Due Date</th>
										<th className='px-6 py-3'>Phone</th>
										<th className='px-6 py-3'>Unit</th>
										<th className='px-6 py-3'>IMEI</th>
										<th className='px-6 py-3'>Total Payment</th>
										<th className='px-6 py-3'>Partial Payment</th>
										<th className='px-6 py-3'>Purple</th>
										<th className='px-6 py-3'>Yellow</th>
										<th className='px-6 py-3'>White</th>
										<th className='px-6 py-3'>Trademark</th>
										{cred.role === "super" && <th className='px-6 py-3'>Branch</th>}
										<th className='px-6 py-3'>Status</th>
										<th className='px-6 py-3'>Action</th>
									</tr>
								</thead>
								<tbody>
									{filteredFinancing.length > 0 ? (
										filteredFinancing.map((row, index) => (
											<FinancingRow
												key={index}
												data={row}
												fetchFinance={
													cred.role === "super" ? fetchFinancing : fetchFinancingByBranchId
												}
											/>
										))
									) : (
										<tr>
											<td
												colSpan='7'
												className='text-center py-4'>
												No records yet.
											</td>
										</tr>
									)}
								</tbody>
							</table>
						</div>

						{/* Pagination Controls */}
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

					{isAddFinancing && (
						<AddFinancing
							fetchFinancing={fetchFinancingByBranchId}
							isOpen={isAddFinancing}
							closeAddInstallModal={() => setIsAddFinancing(false)}
						/>
					)}
				</main>
			</div>
		</div>
	);
}

export default Financing;
