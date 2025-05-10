import React, { useState } from "react";
import { useProductStore } from "../../../store/data";
import { useCredStore } from "../../../store/data";
import { toast } from "sonner";
import supabase from "../../../lib/supabase";

export const Category = ({ category }) => {
	return (
		<option
			value={category.id}
			className='text-black dark:text-gray-200'>
			{category.product_group}
		</option>
	);
};

export const AddProduct = ({
	closeAddProdModal,
	handleGetProductGroupsAndItems,
}) => {
	const token = localStorage.getItem("token");
	const { productGroups } = useProductStore();
	const { cred } = useCredStore();
	const [group, setGroup] = useState(null); // Set initial state to null
	const [selectedImageFile, setSelectedImageFile] = useState(null);
	const [item, setItem] = useState({
		product_id: 0, // Default value
		item_name: "",
		item_imei: "",
		serial: "",
		stocks: 0,
		item_price: 0,
		image_url: "",
		is_bir: false,
	});

	const handleFileInputChange = async (event) => {
		const file = event.target.files[0];
		if (file) {
			const base64 = await toBase64File(file);
			setSelectedImageFile(base64);
			setItem((prevItem) => ({ ...prevItem, image_url: base64 }));
		}
	};

	const toBase64File = (file) => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	};

	const handleSaveNewItem = async () => {
		try {
			const { error } = await supabase.from("items").insert({
				item_name: item.item_name,
				item_imei: item.item_imei,
				serial: item.serial,
				image_url: item.image_url,
				item_price: item.item_price,
				stocks: item.stocks,
				product_id: item.product_id,
				is_bir: item.is_bir,
			});

			if (error) {
				toast.error("Error adding new product in the inventory. Please try again.");
				return;
			}

			toast.success(`Successfully added new item: ${item.item_name}`);

			closeAddProdModal();
			handleGetProductGroupsAndItems();
		} catch (err) {
			console.error("Error adding new item:", err);
			alert("Error adding new item.");
		}
	};

	return (
		<div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
			<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-xl h-[550px] overflow-y-auto'>
				<h2 className='text-2xl text-black font-semibold dark:text-white mb-4'>
					Add Product
				</h2>
				<hr className='mb-4'></hr>
				<div className='flex items-center justify-center w-full'>
					{selectedImageFile ? (
						<div className='w-full h-64 flex items-center justify-center'>
							<img
								src={selectedImageFile}
								alt='Uploaded Thumbnail'
								className='max-h-full rounded-lg'
							/>
						</div>
					) : (
						<label
							htmlFor='dropzone-file'
							className='flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600'>
							<div className='flex flex-col items-center justify-center pt-5 pb-6'>
								<svg
									className='w-8 h-8 mb-4 text-gray-500 dark:text-gray-400'
									aria-hidden='true'
									xmlns='http://www.w3.org/2000/svg'
									fill='none'
									viewBox='0 0 20 16'>
									<path
										stroke='currentColor'
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2'
									/>
								</svg>
								<p className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
									<span className='font-semibold'>Click to upload</span> or drag and drop
								</p>
								<p className='text-xs text-gray-500 dark:text-gray-400'>
									JPG or PNG (MAX. 800x400px)
								</p>
							</div>
							<input
								id='dropzone-file'
								type='file'
								className='hidden'
								onChange={handleFileInputChange}
							/>
						</label>
					)}
				</div>
				<div className='flex flex-col mt-3'>
					<div className='relative mb-4'>
						<label className='block mb-2 dark:text-white font-medium'>
							Product Group
						</label>
						<select
							id='group'
							className={`border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md cursor-pointer ${
								group ? "text-black" : "text-gray-300"
							}`}
							value={group ? group.id : "default"}
							onChange={(e) => {
								const selectedProductGroup = e.target.value;

								const selectedItem = productGroups.find(
									(item) => item.id.toString() === selectedProductGroup
								);
								setGroup(selectedItem);

								console.log(selectedItem.id);

								setItem((prevItem) => ({
									...prevItem,
									product_id: selectedItem.id,
								}));
							}}>
							<option
								value='default'
								className='text-gray-400'>
								--Choose Product Group--
							</option>
							{productGroups?.map((category) => (
								<Category
									category={category}
									key={category.id}
								/>
							))}
						</select>
					</div>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>Item Name</label>
					<input
						type='text'
						onChange={(e) => {
							setItem({
								...item,
								item_name: e.target.value,
							});
						}}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					{/** Update as of May 09, 2025 */}
					<label className='block mb-2 dark:text-white font-medium'>Item IMEI/Serial Number</label>
					<input
						placeholder='Optional'
						type='text'
						onChange={(e) => {
							setItem({
								...item,
								item_imei: e.target.value,
							});
						}}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>
						Date Received
					</label>
					<input
						placeholder='Optional'
						type='text'
						onChange={(e) => {
							setItem({
								...item,
								serial: e.target.value,
							});
						}}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>Stocks</label>
					<input
						type='number'
						onChange={(e) => {
							setItem({
								...item,
								stocks: e.target.value,
							});
						}}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>
						Item Price
					</label>
					<input
						type='number'
						onChange={(e) => {
							setItem({
								...item,
								item_price: e.target.value,
							});
						}}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4 flex gap-3 items-center'>
					<div className='mb-4 flex gap-3 items-center'>
						<input
							type='checkbox'
							id='is_bir'
							checked={item.is_bir}
							onChange={(e) => {
								setItem({
									...item,
									is_bir: e.target.checked,
								});
							}}
						/>
						<label
							htmlFor='is_bir'
							className='dark:text-white font-medium'>
							Belong to BIR item?
						</label>
					</div>
				</div>
				<div className='flex justify-end mt-4'>
					<button
						onClick={handleSaveNewItem}
						className='px-4 py-2 bg-blue-600 text-white rounded-md'>
						Save Item
					</button>
					<button
						onClick={() => closeAddProdModal(true)}
						className='px-4 py-2  text-blue-600 rounded-md'>
						Close
					</button>
				</div>
			</div>
		</div>
	);
};
