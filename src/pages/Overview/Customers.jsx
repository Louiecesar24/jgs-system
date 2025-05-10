import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import { useCustomerStore } from "../../store/data";
import supabase from "../../lib/supabase";
import { toast } from "sonner";
import { useProductLoad } from "../../store/data";
import { useCredStore } from "../../store/data";
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

const Customers = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [lastPage, setLastPage] = useState(1);
	const { customers, setCustomers } = useCustomerStore();
	const { loadProduct } = useProductLoad();
	const { cred } = useCredStore();
	const [searchTerm, setSearchTerm] = useState("");
	const [filterOption, setFilterOption] = useState("all");
	const [isDropdownFilterOpen, setIsDropDownFilterOpen] = useState(false);
	const [globalSearchResults, setGlobalSearchResults] = useState([]);
	const [isSearching, setIsSearching] = useState(false);

	const getCustomer = async (page = 1) => {
		const rowsPerPage = 10;
		const from = (page - 1) * rowsPerPage;
		const to = from + rowsPerPage - 1;

		try {
			const { data, error, count } = await supabase
				.from("customers")
				.select("*", { count: "exact" })
				.range(from, to);

			if (error) {
				toast.error("Error fetching customers. Please try again.");
				console.error(error);
				return;
			}

			setCustomers(data);
			setLastPage(Math.ceil(count / rowsPerPage));
		} catch (err) {
			console.error(err);
			toast.error("Error getting all customer records. Please try again.");
		}
	};

	useEffect(() => {
		getCustomer(currentPage);
	}, [currentPage]);

	const handleClick = (page) => {
		if (page >= 1 && page <= lastPage) {
			setCurrentPage(page);
		}
	};

	useEffect(() => {
		loadProduct();
	}, [loadProduct]);

	useEffect(() => {
		if (cred.role === "admin") fetchInstallmentsAndNotify(cred.branch_id);
	}, []);

	const performGlobalSearch = async (query) => {
		if (!query.trim()) {
			setGlobalSearchResults([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);
		try {
			const { data, error } = await supabase
				.from("customers")
				.select("*")
				.ilike("customer_name", `%${query}%`)
				.limit(5);

			if (error) throw error;
			setGlobalSearchResults(data || []);
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
		setSearchTerm(query);

		if (!query.trim()) {
			getCustomer(currentPage);
			setGlobalSearchResults([]);
			return;
		}

		debouncedSearch(query);
	};

	const handleSelectResult = (customer) => {
		setGlobalSearchResults([]);
		setSearchTerm(customer.customer_name);
		setCustomers([customer]);
	};

	const renderSearchInput = () => (
		<div className='relative'>
			<input
				type='text'
				placeholder='Search Customer by name'
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
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>
			</svg>

			{/* Search Results Dropdown */}
			{searchTerm.trim() && (
				<div className='absolute z-[70] w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border'>
					{globalSearchResults.length > 0 ? (
						globalSearchResults.map((result) => (
							<div
								key={result.id}
								onClick={() => handleSelectResult(result)}
								className='p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'>
								<div className='font-medium'>{result.customer_name}</div>
								<div className='text-sm text-gray-500'>{result.customer_address}</div>
							</div>
						))
					) : (
						<div className='p-2 text-gray-500 text-center'>No Customer Found</div>
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

	const filterCustomers = customers.filter((customer) => {
		const matchesFilter =
			filterOption === "all" ||
			(filterOption === "w/ financing" && customer.bir_tin) ||
			(filterOption === "no financing" && !customer.bir_tin);

		const matchesSearch = customer.customer_name
			.toLowerCase()
			.includes(searchTerm.toLowerCase());

		return matchesFilter && matchesSearch;
	});

	return (
		<div className='flex h-screen overflow-hidden'>
			{/* Sidebar */}
			<Sidebar
				sidebarOpen={sidebarOpen}
				setSidebarOpen={setSidebarOpen}
			/>
			{/* Content area */}
			<div className='relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden'>
				<Header
					sidebarOpen={sidebarOpen}
					setSidebarOpen={setSidebarOpen}
				/>
				<main>
					<div className='px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto'>
						<div className='flex flex-col xl:flex-row justify-between items-start xl:items-center'>
							<div className='flex justify-between items-center w-full'>
								<h1 className='flex flex-col text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-5'>
									Customers
									<p className='text-base font-normal'>Manage your customer records.</p>
								</h1>
								<div className=''>
									<div className='flex gap-2 items-center'>
										{renderSearchInput()}
										{/* Search button */}
									</div>
								</div>
								<div className='flex gap-2'>
									{/* New Filter Button */}
									<div className='relative'>
										<button
											id='filterButton'
											className='btn bg-indigo-500 hover:bg-indigo-600 text-white gap-2'
											type='button'
											onClick={() => setIsDropDownFilterOpen(!isDropdownFilterOpen)}>
											<p className='font-medium text-base'>Filter Customers</p>
											<svg
												className='w-6 h-6'
												viewBox='0 0 24 24'
												fill='none'
												xmlns='http://www.w3.org/2000/svg'
												stroke='#fffafa'>
												<path
													fillRule='evenodd'
													clipRule='evenodd'
													d='M12.7071 14.7071C12.3166 15.0976 11.6834 15.0976 11.2929 14.7071L6.29289 9.70711C5.90237 9.31658 5.90237 8.68342 6.29289 8.29289C6.68342 7.90237 7.31658 7.90237 7.70711 8.29289L12 12.5858L16.2929 8.29289C16.6834 7.90237 17.3166 7.90237 17.7071 8.29289C18.0976 8.68342 18.0976 9.31658 17.7071 9.70711L12.7071 14.7071Z'
													fill='#fefbfb'></path>
											</svg>
										</button>
										<div
											id='filterDropdown'
											className={`absolute left-0 mt-2 z-20 w-48 bg-white divide-y divide-gray-100 border border-gray-200 dark:border-none rounded-lg shadow-xl dark:bg-gray-700 dark:divide-gray-600 ${
												isDropdownFilterOpen ? "" : "hidden"
											}`}>
											<ul className='p-3 space-y-3 text-sm text-gray-700 dark:text-gray-200'>
												<li
													onClick={() => setFilterOption("all")}
													className='hover:cursor-pointer'>
													All
												</li>
												<li
													onClick={() => setFilterOption("no financing")}
													className='hover:cursor-pointer'>
													No Finance
												</li>
												<li
													onClick={() => setFilterOption("w/ financing")}
													className='hover:cursor-pointer'>
													With Finance
												</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div className='p-4 rounded-lg bg-gray-50 dark:bg-gray-800'>
							<div className='w-full overflow-x-auto shadow-md sm:rounded-lg'>
								<table className='w-full text-sm text-left text-gray-500 dark:text-gray-400'>
									<thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
										<tr>
											<th
												scope='col'
												className='px-6 py-3'>
												Customer Name
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Complete Address
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Phone Number
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Occupation
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Trade Mark
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Financing
											</th>
										</tr>
									</thead>
									<tbody>
										{filterCustomers.map((customer, index) => (
											<tr
												key={index}
												className='bg-white border-b dark:bg-gray-800 dark:border-gray-700'>
												<td className='px-6 py-4'>{customer.customer_name}</td>
												<td className='px-6 py-4'>{customer.customer_address}</td>
												<td className='px-6 py-4'>{customer.customer_phone_number}</td>
												<td className='px-6 py-4'>{customer.customer_occupation}</td>
												<td className='px-6 py-4'>{customer.customer_trade_mark}</td>
												<td className='px-6 py-4'>{customer.bir_tin}</td>
											</tr>
										))}
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
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default Customers;
