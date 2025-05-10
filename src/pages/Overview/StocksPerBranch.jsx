import React, { useState, useEffect } from "react";
import { useCredStore } from "../../store/data";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import supabase from "../../lib/supabase";
import { toast } from "sonner";

const StocksPerBranch = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [stocksPerBranch, setStocksPerBranch] = useState([]);
	const [selectedBranch, setSelectedBranch] = useState("1");
	const [branches, setBranches] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOption, setSortOption] = useState("");

	const fetchStocksByBranch = async (branchId) => {
		try {
			const { data, error } = await supabase
				.from("items")
				.select(
					`
                    id, 
                    item_name, 
                    stocks, 
                    number_of_sold, 
                    image_url,
                    is_bir,
                    product_id,
                    products (
                        id, product_group, branch_id,
                        branches ( id, branch_name )
                    )
                `
				)
				.order("stocks", { ascending: false });

			if (error) {
				toast.error("Error fetching data:", error);
				return [];
			}

			// Filter the data based on the branchId
			const filteredData = data.filter(
				(item) => item.products.branch_id === Number(branchId)
			);

			const groupedData = Object.values(
				filteredData.reduce((acc, item) => {
					const branch = item.products.branches;
					const branchId = branch.id;

					if (!acc[branchId]) {
						acc[branchId] = {
							branch_id: branchId,
							branch_name: branch.branch_name,
							products: [],
						};
					}

					acc[branchId].products.push({
						product_name: item.item_name,
						product_group: item.products.product_group,
						remaining_stock: item.stocks,
						total_sold: item.number_of_sold,
						image_url: item.image_url,
						is_bir: item.is_bir,
					});

					return acc;
				}, {})
			);

			setStocksPerBranch(groupedData);
		} catch (err) {
			toast.error("Error retrieving stocks per branch");
		}
	};

	const fetchBranches = async () => {
		try {
			const { data, error } = await supabase
				.from("branches")
				.select("id, branch_name");

			if (error) {
				toast.error("Error fetching branches:", error);
				return [];
			}

			setBranches(data);
		} catch (err) {
			toast.error("Error retrieving branches");
		}
	};

	useEffect(() => {
		fetchBranches();
	}, []);

	useEffect(() => {
		if (selectedBranch) {
			fetchStocksByBranch(selectedBranch);
		}
	}, [selectedBranch]);

	const handleSearch = (e) => {
		setSearchQuery(e.target.value);
	};

	const handleSort = (e) => {
		setSortOption(e.target.value);
	};

	const getFilteredAndSortedData = () => {
		let filteredData =
			stocksPerBranch.length > 0 ? stocksPerBranch[0].products : [];

		if (searchQuery) {
			filteredData = filteredData.filter((item) =>
				item.product_name.toLowerCase().includes(searchQuery.toLowerCase())
			);
		}

		if (sortOption === "remaining_stock_asc") {
			filteredData = filteredData.sort(
				(a, b) => a.remaining_stock - b.remaining_stock
			);
		} else if (sortOption === "remaining_stock_desc") {
			filteredData = filteredData.sort(
				(a, b) => b.remaining_stock - a.remaining_stock
			);
		} else if (sortOption === "number_of_sold_asc") {
			filteredData = filteredData.sort((a, b) => a.total_sold - b.total_sold);
		} else if (sortOption === "number_of_sold_desc") {
			filteredData = filteredData.sort((a, b) => b.total_sold - a.total_sold);
		}

		return filteredData;
	};

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
				<main className='px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto'>
					<h1 className='text-2xl md:text-3xl font-bold mb-8 text-slate-800 dark:text-slate-100'>
						Stocks Per Branch
						<span className='text-base font-normal block mt-1'>
							Check all of the stocks remaining in your branches.
						</span>
					</h1>
					<div className='mb-4 flex gap-4'>
						<select
							value={selectedBranch}
							onChange={(e) => setSelectedBranch(e.target.value)}
							className='border rounded-md p-2'>
							<option value=''>Select Branch</option>
							{branches.map((branch) => (
								<option
									key={branch.id}
									value={branch.id}>
									{branch.branch_name}
								</option>
							))}
						</select>
						<input
							type='text'
							placeholder='Search by item name'
							value={searchQuery}
							onChange={handleSearch}
							className='border rounded-md p-2'
						/>
						<select
							value={sortOption}
							onChange={handleSort}
							className='border rounded-md p-2'>
							<option value=''>Sort By</option>
							<option value='remaining_stock_asc'>
								Remaining Stock (Low to High)
							</option>
							<option value='remaining_stock_desc'>
								Remaining Stock (High to Low)
							</option>
							<option value='number_of_sold_asc'>Number of Sold (Low to High)</option>
							<option value='number_of_sold_desc'>Number of Sold (High to Low)</option>
						</select>
					</div>
					<div className='overflow-x-auto shadow-md sm:rounded-lg'>
						<table className='w-full text-sm text-gray-500'>
							<thead className='bg-indigo-500 text-white'>
								<tr>
									<th className='px-6 py-3'>Product Name</th>
									<th className='px-6 py-3'>Product Group</th>
									<th className='px-6 py-3'>Remaining Stock</th>
									<th className='px-6 py-3'>Total Sold</th>
									<th className='px-6 py-3'>Image</th>
									<th className='px-6 py-3'>BIR Registered</th>
								</tr>
							</thead>
							<tbody>
								{getFilteredAndSortedData().length > 0 ? (
									getFilteredAndSortedData().map((item, index) => (
										<tr
											key={index}
											className='odd:bg-white even:bg-gray-50 border-b hover:bg-indigo-50'>
											<td className='px-6 py-4 font-medium'>{item.product_name}</td>
											<td className='px-6 py-4'>{item.product_group}</td>
											<td className='px-6 py-4'>{item.remaining_stock}</td>
											<td className='px-6 py-4'>{item.total_sold}</td>
											<td className='px-6 py-4'>
												<img
													src={item.image_url}
													alt={item.product_name}
													className='w-12 h-12 rounded-full object-cover'
												/>
											</td>
											<td className='px-6 py-4'>
												{item.is_bir ? (
													<div className='text-center bg-zinc-500 w-full text-white rounded-md text-xs py-1 font-semibold'>
														BIR-REGISTERED ITEM
													</div>
												) : (
													""
												)}
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan='6'
											className='text-center py-4'>
											No stocks available for this branch.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</main>
			</div>
		</div>
	);
};

export default StocksPerBranch;
