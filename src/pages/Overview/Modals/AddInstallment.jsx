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

export const AddInstallment = ({ closeAddInstallModal }) => {
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

	const createNewInstallment = async () => {
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

			const calculateFinalDueDate = (installmentDue, term, hasDownPayment) => {
				const dueDate = new Date(installmentDue);
				const initialMonth = dueDate.getMonth() - 1;
				const initialYear = dueDate.getFullYear();
				const constantDay = dueDate.getDate(); // Store the original day

				const totalMonths = initialMonth + parseInt(term);
				const targetYear = initialYear + Math.floor(totalMonths / 12);
				const targetMonth = totalMonths % 12;

				dueDate.setFullYear(targetYear);
				dueDate.setMonth(targetMonth);
				dueDate.setDate(constantDay); // Restore the original day

				return dueDate.toISOString().split("T")[0];
			};

			const calculateNextPaymentDate = (installmentDue, hasPartialPayment) => {
				if (!hasPartialPayment || hasPartialPayment < 0) return installmentDue;

				const date = new Date(installmentDue);
				const constantDay = date.getDate(); // Store the original day

				date.setMonth(date.getMonth() + 1);
				date.setDate(constantDay); // Restore the original day

				return date.toISOString().split("T")[0];
			};

			const { error: installmentError, data: installmentData } = await supabase
				.from("installments")
				.insert({
					installment_due: calculateFinalDueDate(
						form.installmentDue,
						form.term,
						parseInt(form.partialPayment)
					),
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
					customer_occupation: form.occupation,
					branch_id: cred.branch_id,
				})
				.select("*")
				.single(); // fetch inserted row

			if (installmentError) {
				toast.error("Error creating an installment. Please try again.");
				return;
			}

			const monthOfTheFirstPayment = [
				"January",
				"February",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December",
			][new Date(form.dateReleased).getMonth()];

			if (form.partialPayment !== 0 || installmentData.partial_amount_paid) {
				const { error: monthsToPayError } = await supabase
					.from("months_to_pay")
					.insert({
						selected_month: `${monthOfTheFirstPayment} (Down Payment)`,
						payment: parseInt(form.partialPayment),
						payment_date: form.dateReleased,
						installment_id: installmentData.id,
					});

				if (monthsToPayError) {
					toast.error("Error creating an installment. Please try again.");
					return;
				}
			}

			const { error } = await supabase.from("customers").insert({
				customer_name: form.fullName,
				customer_address: form.address,
				customer_phone_number: form.phone,
				customer_occupation: form.occupation,
				customer_trade_mark: form.trademark,
				bir_tin: form.bir_tin ?? "",
				branch_id: cred.branch_id,
				installment_id: installmentData.id,
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
				.eq("id", installmentData.item_id);

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
				installment_id: installmentData.id,
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
				log_label: `${cred.name} accepted an new installment from ${installmentData.customer_name}`,
				log_category: "New Installment",
				installment_id: installmentData.id,
				user_id: cred?.id,
			});

			if (error2) return;

			toast.success("Installment created successfully!");

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
		<div className='fixed inset-0 flex items-center justify-center z-[200] bg-black bg-opacity-50'>
			<Toaster
				richColors
				position='top-center'
			/>
			<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-4xl h-[550px] overflow-y-auto'>
				<h2 className='text-2xl text-black font-semibold dark:text-white mb-4'>
					Add Installment
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
						onClick={createNewInstallment}
						className='ml-2 px-7 py-2 bg-green-500 text-white rounded'>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};
