import React, { useState, useEffect } from "react";
import { useProductStore } from "../../store/data";
import { useCredStore } from "../../store/data";
import { toast, Toaster } from "sonner";
import ConfirmDirectPurchaseModal from "../Overview/Modals/ConfirmDirectPurchaseModal";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";

const ProductCategory = ({ category }) => {
	return (
		<option
			value={category.id}
			className='text-black dark:text-gray-200'>
			{category.product_group}
		</option>
	);
};

const Category = ({ category }) => {
	return (
		<option
			value={category.id}
			className='text-black dark:text-gray-200'>
			{category.item_name}
		</option>
	);
};

const AddDirectPurchasePage = ({ getPurchases, handleCloseModal }) => {
	const token = localStorage.getItem("token");
	const { products, productGroups } = useProductStore();
	const { cred } = useCredStore();

	const [details, setDetails] = useState({
		item_id: "",
		customer_name: "",
		user_id: cred.id,
		quantity: 0,
		amount: 0,
		payment_method: "Cash",
		reference_number: "",
		collector_name: cred.name,
	});

	const [selectedProductGroup, setSelectedProductGroup] = useState(0);
	const [selectedProducts, setSelectedProducts] = useState([]);
	const [isSavePurchase, setIsSavePurchase] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setDetails((prevDetails) => ({
			...prevDetails,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleSelectChange = (e) => {
		const { name, value } = e.target;
		if (name === "item_group_id") {
			setSelectedProductGroup(Number(value));
		}
		setDetails((prevDetails) => ({
			...prevDetails,
			[name]: value,
		}));

		const selectedItem = products.filter(
			(product) => product.id === Number(value)
		);

		if (selectedItem.length > 0) {
			setDetails((prevDetails) => ({
				...prevDetails,
				amount: selectedItem[0].item_price,
			}));
		} else {
			setDetails((prevDetails) => ({
				...prevDetails,
				amount: 0,
			}));
		}
	};

	const handleSearchChange = (e) => {
		setSearchTerm(e.target.value);
		setIsDropdownOpen(true);
	};

	const handleItemSelect = (category) => {
		setDetails((prevDetails) => ({
			...prevDetails,
			item_id: category.id,
			amount: category.item_price,
		}));
		setSearchTerm(category.item_name);
		setIsDropdownOpen(false);
	};

	const handleDropdownClick = () => {
		setIsDropdownOpen(true);
	};

	const handleAddProduct = () => {
		const selectedItem = products.find(
			(product) => product.id === Number(details.item_id)
		);

		if (!selectedItem) {
			toast.error("Please select a valid product.");
			return;
		}

		const newProduct = {
			item_id: selectedItem.id,
			item_name: selectedItem.item_name,
			item_price: selectedItem.item_price,
			quantity: details.quantity,
		};

		setSelectedProducts((prevProducts) => [...prevProducts, newProduct]);
		setDetails({
			...details,
			item_id: "",
			quantity: 0,
			amount: 0,
		});
	};

	const handleRemoveProduct = (index) => {
		setSelectedProducts((prevProducts) =>
			prevProducts.filter((_, i) => i !== index)
		);
	};

	const handleSaveDirectPurchase = async () => {
		const excludedKeys = ["reference_number"];

		const isInvalid = Object.keys(details)
			.filter((key) => !excludedKeys.includes(key))
			.every((key) => {
				const value = details[key];
				return value === null || value === undefined || value === "";
			});

		if (isInvalid) {
			alert("Please provide all input fields");
			return;
		}

		setIsSavePurchase(true);
	};

	const handleCloseSaveModal = () => {
		setIsSavePurchase(false);
	};

	useEffect(() => {
		if (details.quantity === "") {
			return;
		}

		const quantityValue = Number(details.quantity);
		if (quantityValue >= 0 && details.amount > 0) {
			setDetails((prevDetails) => ({
				...prevDetails,
				amount: prevDetails.amount * quantityValue,
			}));
		}
	}, [details.quantity]);

	const filteredProducts = products
		?.filter((product) => product.product_id === Number(selectedProductGroup))
		.filter((product) => 
			searchTerm === '' || product.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
		);

	return (
		<div className='flex h-screen overflow-hidden'>
			{/* Sidebar */}
			<Sidebar
				sidebarOpen={sidebarOpen}
				setSidebarOpen={setSidebarOpen}
			/>

			{/* Content area */}
			<div className='relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden'>
				{/* Site header */}
				<Header
					sidebarOpen={sidebarOpen}
					setSidebarOpen={setSidebarOpen}
				/>

				<main>
					<div className='container mx-auto p-4'>
						<Toaster
							richColors
							position='top-center'
						/>
						{isSavePurchase && (
							<ConfirmDirectPurchaseModal
								details={details}
								selectedProducts={selectedProducts}
								getPurchases={getPurchases}
								handleCloseSaveModal={handleCloseSaveModal}
								handleCloseModal={handleCloseModal}
							/>
						)}
						<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full mx-auto'>
							<h2 className='text-2xl text-black font-semibold dark:text-white mb-4'>
								Add Direct Purchase
							</h2>
							<hr className='mb-4' />
							<div className='grid grid-cols-4 gap-4'>
								{/* Select Product Group */}
								<div>
									<label className='block text-gray-700 dark:text-white font-medium mb-2'>
										Select Product Group
									</label>
									<select
										name='item_group_id'
										value={selectedProductGroup}
										onChange={handleSelectChange}
										className='w-full p-2 border bg-gray-50 dark:bg-slate-600 dark:text-white rounded-md'>
										<option value=''>--Choose Product Group--</option>
										{productGroups?.map((group, index) => (
											<ProductCategory
												category={group}
												key={index}
											/>
										))}
									</select>
								</div>

								{/* Custom Dropdown for Item Selection */}
								<div>
									<label className='block text-gray-700 dark:text-white font-medium mb-2'>
										Select Item to purchase
									</label>
									<div className='relative'>
										<input
											type="text"
											value={searchTerm}
											onChange={handleSearchChange}
											onClick={handleDropdownClick}
											placeholder="Search products..."
											className="w-full p-2 border bg-gray-50 dark:bg-slate-600 dark:text-white rounded-md"
										/>
										{isDropdownOpen && (
											<div className='absolute z-10 w-full bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-700 rounded-md mt-1 max-h-60 overflow-y-auto'>
												<ul>
													{filteredProducts.map((category, index) => (
														<li
															key={index}
															onClick={() => handleItemSelect(category)}
															className='cursor-pointer p-2 hover:bg-gray-200 dark:hover:bg-slate-700'>
															{category.item_name}
														</li>
													))}
												</ul>
											</div>
										)}
									</div>
								</div>

								{/* Customer Name */}
								<div>
									<label className='block text-gray-700 dark:text-white font-medium mb-2'>
										Customer Name
									</label>
									<input
										type='text'
										name='customer_name'
										value={details.customer_name}
										onChange={handleChange}
										className='w-full p-2 border bg-gray-50 dark:bg-slate-600 dark:text-white rounded-md'
									/>
								</div>

								{/* Quantity */}
								<div>
									<label className='block text-gray-700 dark:text-white font-medium mb-2'>
										Quantity
									</label>
									<input
										type='number'
										name='quantity'
										value={details.quantity}
										onChange={handleChange}
										className='w-full p-2 border bg-gray-50 dark:bg-slate-600 dark:text-white rounded-md'
									/>
								</div>
								<div>
									<label className='block text-gray-700 dark:text-white font-medium mb-2'>
										Amount
									</label>
									<input
										type='number'
										name='amount'
										value={details.amount}
										onChange={handleChange}
										className='w-full p-2 border bg-gray-50 dark:bg-slate-600 dark:text-white rounded-md'
									/>
								</div>
								{details?.payment_method === "Gcash" && (
									<div>
										<label className='block text-gray-700 dark:text-white font-medium mb-2'>
											GCASH Reference Number
										</label>
										<input
											type='text'
											name='reference_number'
											value={details.reference_number}
											onChange={handleChange}
											className='w-full p-2 border bg-gray-50 dark:bg-slate-600 dark:text-white rounded-md'
										/>
									</div>
								)}
							</div>

							{/* Table of Selected Products */}
							<div className='overflow-x-auto mt-6'>
								<table className='min-w-full table-auto border-collapse'>
									<thead>
										<tr className='bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-white'>
											<th className='px-4 py-2 border'>Item</th>
											<th className='px-4 py-2 border'>Quantity</th>
											<th className='px-4 py-2 border'>Price</th>
											<th className='px-4 py-2 border'>Action</th>
										</tr>
									</thead>
									<tbody>
										{selectedProducts.map((product, index) => (
											<tr
												key={index}
												className={index % 2 === 0 ? "bg-gray-100" : "bg-gray-50"}>
												<td className='px-4 py-2 border'>{product.item_name}</td>
												<td className='px-4 py-2 border'>{product.quantity}</td>
												<td className='px-4 py-2 border'>{product.item_price}</td>
												<td className='px-4 py-2 border'>
													<button
														onClick={() => handleRemoveProduct(index)}
														className='text-red-500'>
														Remove
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<div className='mt-5 flex gap-4'>
								{/* Payment Method */}
								<div>
									<label className='block text-gray-700 dark:text-white font-medium mb-2'>
										Payment Method
									</label>
									<select
										name='payment_method'
										value={details.payment_method}
										onChange={handleSelectChange}
										className='w-full p-2 border bg-gray-50 dark:bg-slate-600 dark:text-white rounded-md'>
										<option
											value='default'
											className='text-gray-400'>
											Select Payment Method
										</option>
										{["Cash", "Gcash"].map((type, idx) => (
											<option
												key={idx}
												value={type}>
												{type}
											</option>
										))}
									</select>
								</div>
								{/* Cashier Name */}
								<div className='mb-4'>
									<label className='block mb-2 dark:text-white font-medium'>
										Cashier name
									</label>
									<input
										name='collector_name'
										value={details.collector_name}
										onChange={handleChange}
										className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
									/>
								</div>
							</div>
							<div className='mt-4 gap-2 flex justify-end'>
								<button
									onClick={handleAddProduct}
									className='px-4 py-2 bg-blue-500 text-white rounded'>
									Add Product
								</button>
								<button
									onClick={handleSaveDirectPurchase}
									className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md'>
									Save Direct Purchase
								</button>
							</div>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default AddDirectPurchasePage;
