import React, { useEffect, useState } from "react";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import { useCredStore } from "../../store/data";
import { AddProduct } from "./Modals/AddProduct";
import { AddProdGroup } from "./Modals/AddProdGroup";
import { ProductModal } from "./Modals/ProductModal";
import { useProductStore } from "../../store/data";
import formatMoney from "../../utils/formatMoney";
import supabase from "../../lib/supabase";
import { toast, Toaster } from "sonner";
import { fetchInstallmentsAndNotify } from "../../utils/notifier";
import InspectProductModal from "./Modals/InspectProductModal";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export const Product = ({ productData, handleGetProductGroupsAndItems }) => {
	const [isInspectProduct, setIsInspectProduct] = useState(false);
	const [isProductOpen, setIsProductOpen] = useState(false);

	const handleProdOpen = () => {
		setIsProductOpen(true);
	};

	const closeProdModal = () => {
		setIsProductOpen(false);
	};

	return (
		<div className='w-full max-w-sm mx-auto bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700'>
			<img
				className='p-8 rounded-t-lg'
				src={productData.image_url}
				alt='product image'
			/>
			<div className='px-5 pb-5'>
				<h5 className='text-xl font-semibold tracking-tight text-gray-900 dark:text-white'>
					{productData.item_name}
				</h5>
				<p>IMEI: {productData.item_imei ?? "N/A"}</p>
				<p>Serial Number: {productData.serial ?? "N/A"}</p>

				<p>Stock: {productData.stocks}</p>
				<span>Sold: {productData.number_of_sold}</span>
				<div className='flex items-center justify-between'>
					<span className='text-3xl font-bold text-gray-900 dark:text-white'>
						₱{formatMoney(productData.item_price)}
					</span>
					{productData.is_bir && (
						<sup className='bg-zinc-300 text-dark text-[8px] rounded-md p-3'>
							BIR-registered Item
						</sup>
					)}
				</div>

				<div className='flex gap-4 items-center'>
					<button
						onClick={() => setIsInspectProduct(true)}
						className='font-bold bg-blue-700 text-white rounded-md p-2'>
						Inspect
					</button>
					<button
						onClick={handleProdOpen}
						className='btn bg-green-500 hover:bg-green-600 text-white gap-2'>
						<svg
							className='w-[20px] h-[20px]'
							viewBox='0 0 24 24'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'>
							<path
								d='M11 4H7.2C6.0799 4 5.51984 4 5.09202 4.21799C4.71569 4.40974 4.40973 4.7157 4.21799 5.09202C4 5.51985 4 6.0799 4 7.2V16.8C4 17.9201 4 18.4802 4.21799 18.908C4.40973 19.2843 4.71569 19.5903 5.09202 19.782C5.51984 20 6.0799 20 7.2 20H16.8C17.9201 20 18.4802 20 18.908 19.782C19.2843 19.5903 19.5903 19.2843 19.782 18.908C20 18.4802 20 17.9201 20 16.8V12.5M15.5 5.5L18.3284 8.32843M10.7627 10.2373L17.411 3.58902C18.192 2.80797 19.4584 2.80797 20.2394 3.58902C21.0205 4.37007 21.0205 5.6364 20.2394 6.41745L13.3774 13.2794C12.6158 14.0411 12.235 14.4219 11.8012 14.7247C11.4162 14.9936 11.0009 15.2162 10.564 15.3882C10.0717 15.582 9.54378 15.6885 8.48793 15.9016L8 16L8.04745 15.6678C8.21536 14.4925 8.29932 13.9048 8.49029 13.3561C8.65975 12.8692 8.89125 12.4063 9.17906 11.9786C9.50341 11.4966 9.92319 11.0768 10.7627 10.2373Z'
								stroke='#ffffff'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'></path>
						</svg>
						<p className='hidden lg:flex sm:block font-bold text-md'>Edit</p>
					</button>
				</div>
			</div>
			{isProductOpen && (
				<ProductModal
					handleGetProductGroupsAndItems={handleGetProductGroupsAndItems}
					productData={productData}
					isOpen={isProductOpen}
					closeProdModal={closeProdModal}
				/>
			)}

			{isInspectProduct && (
				<InspectProductModal
					product={productData}
					setIsInspectProduct={setIsInspectProduct}
				/>
			)}
		</div>
	);
};

export const Category = ({
	category,
	onSelect,
	handleGetProductGroupsAndItems,
}) => {
	const handleDeleteCategory = async (category) => {
		const confirmed = confirm(
			`Are you sure you want to delete "${category.product_group}"?`
		);

		if (confirmed) {
			try {
				const { error } = await supabase
					.from("products")
					.delete()
					.eq("id", category.id);

				if (error) {
					toast.error(
						"Product Group delete cancelled. Please check your internet connection and try again."
					);
					return;
				}

				toast.success(`${category.product_group} deleted successfully`);
				handleGetProductGroupsAndItems();
			} catch (err) {
				toast.error("Product Group delete cancelled.");
				return;
			}

			toast.success(`${category.product_group} successfully deleted!`);
		} else {
			toast.error("Product group deletion cancelled");
			return;
		}
	};

	return (
		<li className='hover:bg-slate-100 dark:hover:bg-slate-600 px-3 py-1 rounded'>
			<div className='flex items-center justify-between'>
				<div className=''>
					<input
						id={`checkbox-${category.id}`}
						type='checkbox'
						value={category.id}
						className='rounded'
						onChange={(e) => onSelect(e.target.checked, category.id)}
					/>
					<label
						htmlFor={`checkbox-${category.id}`}
						className='ms-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
						{category.product_group}
					</label>
				</div>
				<button
					onClick={() => handleDeleteCategory(category)}
					className='text-xs text-white bg-red-500 px-2 py-1 rounded-md hover:shadow-lg duration-100'>
					Delete
				</button>
			</div>
		</li>
	);
};

const Inventory = () => {
	const token = localStorage.getItem("token");
	const { cred } = useCredStore();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isAddProdModalOpen, setAddProdModalOpen] = useState(false);
	const [isAddProdGroupModalOpen, setAddProdGroupModalOpen] = useState(false);
	const [isDropdownOpen, setDropdownOpen] = useState(false);
	const [searchItem, setSearchItem] = useState("");
	const { productGroups, setProductGroups, products, setProducts } =
		useProductStore();
	const [selectedCategories, setSelectedCategories] = useState(new Set());
	const [filterOption, setFilterOption] = useState("all");
	const [isDropdownFilterOpen, setIsDropDownFilterOpen] = useState(false);
	const [isDropdownSortOpen, setIsDropDownSortOpen] = useState(false);
	const [sortOption, setSortOption] = useState("asc");

	const handleGetProductGroupsAndItems = async () => {
		const handleError = (message) => {
			toast.error(message);
			console.error(message);
		};

		try {
			// Fetch product groups
			const { data: productData, error: productError } = await supabase
				.from("products")
				.select("*")
				.eq("branch_id", cred?.branch_id);

			if (productError) {
				handleError(
					"Error retrieving product groups. Please check your internet connection and try again."
				);
				return;
			}

			setProductGroups(productData);

			if (productData.length > 0) {
				// Fetch items concurrently
				const productIds = productData.map((product) => product.id);
				const { data: itemsData, error: itemsError } = await supabase
					.from("items")
					.select("*")
					.in("product_id", productIds); // Use .in() to fetch all items with product_id in productIds

				if (itemsError) {
					handleError(
						"Error retrieving items. Please check your internet connection and try again."
					);
					return;
				}

				setProducts(itemsData);
			}
		} catch (err) {
			handleError("Error retrieving product groups and items");
		}
	};

	const handleAddProduct = () => {
		setAddProdModalOpen(true);
	};

	const handleAddProdGroup = () => {
		setAddProdGroupModalOpen(true);
	};

	const closeAddProdModal = () => {
		setAddProdModalOpen(false);
	};

	const closeAddProdGroupModal = () => {
		console.log("triggord");
		setAddProdGroupModalOpen(false);
	};

	const toggleDropdown = () => {
		setDropdownOpen(!isDropdownOpen);
	};

	useEffect(() => {
		handleGetProductGroupsAndItems();
	}, []);

	const filteredProducts = products.filter((item) => {
		const matchesSearch = item.item_name
			.toLowerCase()
			.includes(searchItem.toLowerCase());

		const matchesCategory =
			selectedCategories.size === 0 || selectedCategories.has(item.product_id);

		const matchesFilter =
			filterOption === "all" ||
			(filterOption === "bir" && item.is_bir) ||
			(filterOption === "non-bir" && !item.is_bir);

		return matchesSearch && matchesCategory && matchesFilter;
	});

	const sortedProducts = [...filteredProducts].sort((a, b) => {
		if (sortOption === "asc") {
			return a.stocks - b.stocks;
		} else {
			return b.stocks - a.stocks;
		}
	});

	const handleCategorySelect = (isChecked, categoryId) => {
		const updatedCategories = new Set(selectedCategories);
		if (isChecked) {
			updatedCategories.add(categoryId);
		} else {
			updatedCategories.delete(categoryId);
		}
		setSelectedCategories(updatedCategories);
	};

	useEffect(() => {
		if (cred.role === "admin") fetchInstallmentsAndNotify(cred.branch_id);
	}, []);

	const exportToExcel = () => {
		const filteredProductsArray = filteredProducts
			.sort((a, b) => a.stocks - b.stocks)
			.map((item) => {
				return {
					"Item ID": item.id,
					"Item Name": item.item_name,
					"Item IMEI": item.item_imei ?? "N/A",
					"Item Serial": item.serial ?? "N/A",
					"Remaining Stocks": item.stocks,
					"Number of Solds": item.number_of_sold,
					"Item Price": formatMoney(item.item_price),
					"Item BIR Registered?": item.is_bir ? "Yes" : "No",
					Category:
						productGroups.find((product) => product.id === item.product_id)?.[
							"product_group"
						] ?? "N/A",
				};
			});

		const worksheet = XLSX.utils.json_to_sheet(filteredProductsArray);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
		XLSX.writeFile(workbook, "Inventory.xlsx");
	};

	const exportToPDF = () => {
		const doc = new jsPDF();
		const tableColumn = [
			"Item Name",
			"IMEI",
			"Serial Number",
			"Stock",
			"Sold",
			"Price",
			"BIR Registered",
			"Category",
		];
		const tableRows = [];

		filteredProducts
			.sort((a, b) => a.stocks - b.stocks)
			.forEach((item) => {
				const itemData = [
					item.item_name,
					item.item_imei ?? "N/A",
					item.serial ?? "N/A",
					item.stocks,
					item.number_of_sold,
					formatMoney(item.item_price),
					item.is_bir ? "Yes" : "No",
					productGroups.find((product) => product.id === item.product_id)?.[
						"product_group"
					] ?? "N/A",
				];
				tableRows.push(itemData);
			});

		doc.autoTable(tableColumn, tableRows, { startY: 20 });
		doc.text("Inventory List", 14, 15);
		doc.save("Inventory.pdf");
	};

	return (
		<div className='flex h-screen overflow-hidden'>
			{/* Sidebar */}
			<Sidebar
				sidebarOpen={sidebarOpen}
				setSidebarOpen={setSidebarOpen}
			/>
			{/* Content area */}
			<div className='relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden'>
				{/*  Site header */}
				<Header
					sidebarOpen={sidebarOpen}
					setSidebarOpen={setSidebarOpen}
				/>
				<main>
					<div className='flex flex-col px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto'>
						<h1 className='flex flex-col text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-8'>
							Your Inventory{" "}
							<span className='text-base font-normal'>Here's your inventory.</span>
						</h1>

						<div className='shadow-xl rounded-2xl bg-white dark:bg-slate-800 p-8 xl:flex-col xl:justify-between items-end sm:items-center lg:mb-8'>
							<div className='flex flex-col 2xl:flex-row justify-between gap-4 mb-4'>
								<div className='flex gap-4 items-center'>
									{/* Search Bar */}
									<input
										type='text'
										placeholder='Search item...'
										value={searchItem}
										onChange={(e) => setSearchItem(e.target.value)}
										className='border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 w-full lg:w-64 dark:bg-slate-700 dark:text-white'
									/>
									{/* Filter Dropdown */}
									<div className='relative'>
										<button
											onClick={() => setIsDropDownFilterOpen(!isDropdownFilterOpen)}
											className='bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg'>
											Filter: {filterOption === "all" ? "All" : filterOption}
										</button>
										{isDropdownFilterOpen && (
											<ul className='absolute z-10 bg-white dark:bg-slate-700 rounded shadow-lg mt-2'>
												<li
													className='px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
													onClick={() => setFilterOption("all")}>
													All
												</li>
												<li
													className='px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
													onClick={() => setFilterOption("bir")}>
													BIR-Registered
												</li>
												<li
													className='px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
													onClick={() => setFilterOption("non-bir")}>
													Non BIR-Registered
												</li>
											</ul>
										)}
									</div>
									{/* Sort Dropdown */}
									<div className='relative'>
										<button
											onClick={() => setIsDropDownSortOpen(!isDropdownSortOpen)}
											className='bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg'>
											Sort: {sortOption === "asc" ? "Ascending" : "Descending"}
										</button>
										{isDropdownSortOpen && (
											<ul className='absolute z-10 bg-white dark:bg-slate-700 rounded shadow-lg mt-2'>
												<li
													className='px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
													onClick={() => setSortOption("asc")}>
													Ascending
												</li>
												<li
													className='px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
													onClick={() => setSortOption("desc")}>
													Descending
												</li>
											</ul>
										)}
									</div>
								</div>
								{/* Action Buttons */}
								<div className='flex gap-4'>
									<button
										onClick={handleAddProdGroup}
										className='bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded'>
										Add Product Group
									</button>
									<button
										onClick={handleAddProduct}
										className='bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded'>
										Add Product
									</button>
									<button
										onClick={exportToExcel}
										className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded'>
										Export to Excel
									</button>
									<button
										onClick={exportToPDF}
										className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded'>
										Export to PDF
									</button>
								</div>
							</div>

							{/* Categories and Items */}
							<div className='grid grid-cols-1 lg:grid-cols-4 gap-4'>
								{/* Categories */}
								<div className='bg-gray-50 dark:bg-slate-800 p-4 rounded shadow'>
									<h3 className='text-lg font-bold mb-4'>Categories</h3>
									<ul className='space-y-2'>
										{productGroups.map((category) => (
											<Category
												key={category.id}
												category={category}
												handleGetProductGroupsAndItems={handleGetProductGroupsAndItems}
												onSelect={handleCategorySelect}
											/>
										))}
									</ul>
								</div>
								{/* Products */}
								<div className='col-span-1 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
									{sortedProducts.map((product) => (
										<Product
											key={product.id}
											productData={product}
											handleGetProductGroupsAndItems={handleGetProductGroupsAndItems}
										/>
									))}
								</div>
							</div>
						</div>
					</div>
				</main>
			</div>
			{/* Modals */}
			{isAddProdModalOpen && (
				<AddProduct
					isOpen={isAddProdModalOpen}
					closeAddProdModal={closeAddProdModal}
					handleGetProductGroupsAndItems={handleGetProductGroupsAndItems}
				/>
			)}
			{isAddProdGroupModalOpen && (
				<AddProdGroup
					isOpen={isAddProdGroupModalOpen}
					closeAddProdGroupModal={closeAddProdGroupModal}
					handleGetProductGroupsAndItems={handleGetProductGroupsAndItems}
				/>
			)}
		</div>
	);
};

export default Inventory;
