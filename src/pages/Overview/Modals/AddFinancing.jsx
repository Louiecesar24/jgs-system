import React, { useState } from "react";
import { useProductStore } from "../../../store/data";
import supabase from "../../../lib/supabase";
import { toast, Toaster } from "sonner";
import { useCredStore, useCustomerStore } from "../../../store/data";

export const Units = ({ units }) => {
	return (
		<option
			value={units.id}
			className='text-black dark:text-gray-200'>
			{units.item_name}
		</option>
	);
};

export const AddFinancing = ({ fetchFinancing, closeAddInstallModal }) => {
	const { cred } = useCredStore();
	const [form, setForm] = useState({
		fullName: "",
		address: "",
		phone: "",
		term: 0,
		dateReleased: "",
		unitId: "",
		totalAmount: 0,
		partialPayment: 0,
		occupation: "",
		trademark: "",
		financing: "Home Credit",
		bir_tin: "",
	});
	const { customers } = useCustomerStore();
	const { products, productGroups } = useProductStore();
	const [selectedProductGroup, setSelectedProductGroup] = useState(0);
	const [searchTerm, setSearchTerm] = useState('');
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setForm((prevForm) => {
			const updatedForm = {
				...prevForm,
				[name]: value,
			};

			if (name === "unitId") {
				const selectedProduct = products.find(
					(product) => product.id === Number(value)
				);
				console.log(selectedProduct, value);
				if (selectedProduct) {
					updatedForm.totalAmount = selectedProduct.item_price;
				}
			}

			if (name === "quantity") {
				const quantityValue = Number(value);
				const pricePerUnit = Number(updatedForm.totalAmount);
				updatedForm.totalAmount = quantityValue * pricePerUnit;
			}

			return updatedForm;
		});
	};

	const calculateMonthlyPayment = () => {
		const remainingAmount = form.totalAmount - form.partialPayment;
		return remainingAmount / form.term;
	};

	const createNewFinancing = async () => {
		try {
			const monthlyPayment = calculateMonthlyPayment();

			const { data: itemData } = await supabase
				.from("items")
				.select("number_of_sold, stocks")
				.eq("id", Number(form.unitId))
				.single();

			const currentStock = itemData.stocks;
			const requestedQuantity = Number(form.quantity);

			if (currentStock <= 0) {
				toast.error("No more stocks available for this item.");
				return;
			}

			if (currentStock < requestedQuantity) {
				toast.error(
					`Stocks Remaining: ${currentStock}. Insufficient stocks. Please try again.`
				);
				return;
			}

			const selectedItem = products.find(
				(product) => product.id === Number(form.unitId)
			);

			const remainingStocks = currentStock - requestedQuantity;
			toast.info(
				`Remaining stocks for ${selectedItem.item_name}: ${remainingStocks}`
			);

			const calculateFinalDueDate = (installmentDue, term) => {
				const dueDate = new Date(installmentDue);
				dueDate.setMonth(dueDate.getMonth() + term);
				return dueDate.toISOString().split("T")[0];
			};

			const { error: financingError, data: financingData } = await supabase
				.from("financing")
				.insert({
					installment_due: calculateFinalDueDate(form.installmentDue, form.term),
					latest_payment_date: form.installmentDue,
					date_released: form.dateReleased,
					customer_full_address: form.address,
					status: "On-going",
					phone: form.phone,
					total: parseInt(form.totalAmount),
					partial_amount_paid: parseInt(form.partialPayment),
					monthly_payment: monthlyPayment,
					item_id: form.unitId,
					trademark: form.trademark,
					customer_name: form.fullName,
					term: form.term,
					referral: form.referral,
					quantity: form.quantity,
					collector_name: cred.name,
					financing: form.financing,
					customer_occupation: form.occupation,
					branch_id: cred.branch_id,
				})
				.select("*")
				.single(); // fetch inserted row

			if (financingError) {
				toast.error("Error creating an financing. Please try again.");
				return;
			}

			const { error } = await supabase.from("customers").insert({
				customer_name: form.fullName,
				customer_address: form.address,
				customer_phone_number: form.phone,
				customer_occupation: form.occupation,
				customer_trade_mark: form.trademark,
				bir_tin: form.financing ?? "",
				branch_id: cred.branch_id,
			});

			if (error) {
				toast.error("Error creating an installment. Please try again.");
				return;
			}

			const numberOfSolds =
				Number(itemData.number_of_sold) + Number(form.quantity);

			//update item
			const { error: updateError, data: updateData } = await supabase
				.from("items")
				.update({
					stocks: remainingStocks,
					number_of_sold: numberOfSolds,
				})
				.eq("id", financingData.item_id);

			if (updateError) {
				toast.error("Error updating number of stocks and number of solds");
				return;
			}

			//insert new sale
			const { error: salesError } = await supabase.from("sales").insert({
				amount: parseInt(form.partialPayment) ?? 0,
				payment_method: "Cash",
				date_issued: new Date(),
				branch_id: cred.branch_id,
			});

			if (salesError) return;

			const { data: empData, error: empErr } = await supabase
				.from("employees")
				.select("number_of_transactions")
				.eq("user_id", cred.id);

			if (empErr) return;

			const currTransactions = empData[0].number_of_transactions;

			const { error: empError2 } = await supabase
				.from("employees")
				.update({
					number_of_transactions: currTransactions + 1,
				})
				.eq("user_id", cred.id);

			if (empError2) return;

			const { error: error2 } = await supabase.from("logs").insert({
				log_label: `${cred.name} accepted an new installment from ${financingData.customer_name}`,
				log_category: "New Installment",
				user_id: cred?.id,
			});

			if (error2) return;

			fetchFinancing(cred.branch_id);
			toast.success("Financing created successfully!");
			closeAddInstallModal();
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred. Please try again.");
		}
	};

	const handleProductGroupChange = (e) => {
		const { value } = e.target;
		setSelectedProductGroup(Number(value));
	};

	const handleSearchChange = (e) => {
		setSearchTerm(e.target.value);
		setIsDropdownOpen(true);
	};

	const handleItemSelect = (unit) => {
		handleInputChange({ target: { name: 'unitId', value: unit.id } });
		setSearchTerm(unit.item_name);
		setIsDropdownOpen(false);
	};

	const filteredProducts = products
		.filter((product) => product.product_id === selectedProductGroup)
		.filter((product) => 
			searchTerm === '' || product.item_name?.toLowerCase().includes(searchTerm.toLowerCase())
		);

	return (
		<div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
			<Toaster
				richColors
				position='top-center'
			/>
			<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-4xl h-[550px] overflow-y-auto'>
				<h2 className='text-2xl text-black font-semibold dark:text-white mb-4'>
					Add Financing Record
				</h2>
				<hr className='mb-4' />
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>Full Name</label>
					<input
						name='fullName'
						onChange={handleInputChange}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>Address</label>
					<input
						name='address'
						onChange={handleInputChange}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>

				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>
						Occupation
					</label>
					<input
						name='occupation'
						onChange={handleInputChange}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>Financing</label>
					<select
						//defaultValue={data?.financing}
						onChange={(e) => setForm({ ...form, financing: e.target.value })}
						className='form-select w-full block mt-1 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'>
						<option value='Home Credit'>Home Credit</option>
						<option value='Skyro'>Skyro</option>
						{/** update */}
						<option value='Billease'>Billease</option>
					</select>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>
						Phone Number
					</label>
					<input
						name='phone'
						onChange={handleInputChange}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='flex gap-4'>
					<div className='mb-4 w-full'>
						<label className='block mb-2 dark:text-white font-medium'>
							Term (Months to pay)
						</label>
						<input
							type='number'
							name='term'
							onChange={handleInputChange}
							className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
						/>
					</div>
					<div className='mb-4 w-full'>
						<label className='block mb-2 dark:text-white font-medium'>
							Released Date
						</label>
						<input
							type='date'
							name='dateReleased'
							onChange={handleInputChange}
							className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
						/>
					</div>
					<div className='mb-4 w-full'>
						<label className='block mb-2 dark:text-white font-medium'>Due Date</label>
						<input
							type='date'
							name='installmentDue'
							onChange={handleInputChange}
							className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
						/>
					</div>
				</div>
				<div className='relative mb-4 w-full'>
					<label className='block mb-2 dark:text-white font-medium'>
						Product Group
					</label>
					<select
						name='productGroupId'
						onChange={handleProductGroupChange}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md cursor-pointer'>
						<option value=''>--Choose Product Group--</option>
						{productGroups.map((group) => (
							<option
								key={group.id}
								value={group.id}>
								{group.product_group}
							</option>
						))}
					</select>
				</div>
				<div className='relative mb-4 w-full'>
					<label className='block mb-2 dark:text-white font-medium'>
						Unit/Items
					</label>
					<div className='relative'>
						<input
							type="text"
							value={searchTerm}
							onChange={handleSearchChange}
							onClick={() => setIsDropdownOpen(true)}
							placeholder="Search units..."
							className="w-full p-2 border bg-gray-50 dark:bg-slate-600 dark:text-white rounded-md"
						/>
						{isDropdownOpen && (
							<div className='absolute z-10 w-full bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-700 rounded-md mt-1 max-h-60 overflow-y-auto'>
								<ul>
									{filteredProducts.map((unit) => (
										<li
											key={unit.id}
											onClick={() => handleItemSelect(unit)}
											className='cursor-pointer p-2 hover:bg-gray-200 dark:hover:bg-slate-700'>
											{unit.item_name}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>Quantity</label>
					<input
						type='number'
						name='quantity'
						onChange={handleInputChange}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>
						Total Amount
					</label>
					<input
						type='number'
						name='totalAmount'
						value={form.totalAmount}
						onChange={handleInputChange}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>
						Down Payment
					</label>
					<input
						type='number'
						name='partialPayment'
						onChange={handleInputChange}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>Trademark</label>
					<textarea
						type='text'
						name='trademark'
						onChange={handleInputChange}
						className='h-[120px] border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='flex justify-end'>
					<button
						onClick={closeAddInstallModal}
						className='px-4 py-2 text-white bg-gray-400 rounded'>
						Cancel
					</button>
					<button
						onClick={createNewFinancing}
						className='ml-2 px-7 py-2 bg-green-500 text-white rounded'>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};
