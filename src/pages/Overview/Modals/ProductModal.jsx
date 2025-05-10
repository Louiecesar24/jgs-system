import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import supabase from "../../../lib/supabase";

export const ProductModal = ({
	productData,
	closeProdModal,
	handleGetProductGroupsAndItems,
}) => {
	const [prodEdit, setProdEdit] = useState(productData);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setProdEdit((prevStatus) => ({
			...prevStatus,
			[name]: value,
		}));
	};

	const handleSave = async () => {
		try {
			const { data, error } = await supabase
				.from("items")
				.update({
					item_name: prodEdit.product,
					item_price: parseFloat(prodEdit.price),
					stocks: prodEdit.stocks,
				})
				.eq("id", prodEdit.id);

			if (error) {
				toast.error("Error updating product. Please try again.");
				return;
			}

			toast.success("Product updated successfully!");
			handleGetProductGroupsAndItems();
			closeProdModal();
		} catch (err) {
			console.error(err);
			toast.error("An unexpected error occurred. Please try again.");
		}
	};

	const handleDelete = async () => {
		if (window.confirm("Are you sure you want to delete this product?")) {
			try {
				const { error } = await supabase
					.from("items")
					.delete()
					.eq("id", prodEdit.id);

				if (error) {
					toast.error("Error deleting product. Please try again.");
					return;
				}

				toast.success("Product deleted successfully!");
				handleGetProductGroupsAndItems();
				closeProdModal();
			} catch (err) {
				console.error(err);
				toast.error("An unexpected error occurred. Please try again.");
			}
		}
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
			<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-xl max-h-full'>
				<div className='flex items-center justify-between'>
					<h2 className='flex items-center justify-center text-2xl text-black font-semibold dark:text-white'>
						Edit Product
					</h2>
					<button
						onClick={handleDelete}
						className='btn bg-red-500 hover:bg-red-600 text-white gap-2'>
						<svg
							className='text-white w-5 h-5'
							viewBox='0 0 24 24'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'>
							<path
								d='M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6M14 10V17M10 10V17'
								stroke='#ffffff'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'></path>
						</svg>
						<span className='hidden md:block font-bold text-md'>Delete</span>
					</button>
				</div>
				<hr className='my-4'></hr>
				<div className='flex items-center justify-center w-full'>
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
								SVG, PNG, JPG or GIF (MAX. 800x400px)
							</p>
						</div>
						<input
							name='image'
							id='dropzone-file'
							type='file'
							className='hidden'
						/>
					</label>
				</div>
				<div className='my-4'>
					<label className='block mb-2 dark:text-white font-medium'>Item Name</label>
					<input
						name='product'
						onChange={handleChange}
						value={prodEdit.product}
						type='text'
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>Price</label>
					<input
						name='price'
						onChange={handleChange}
						value={prodEdit.price}
						type='text'
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white font-medium'>
						Stocks Remaining
					</label>
					<input
						name='stocks'
						onChange={handleChange}
						value={prodEdit.stocks}
						type='text'
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='flex justify-end'>
					<button
						onClick={closeProdModal}
						className='px-4 py-2 text-white bg-gray-400 rounded'>
						Cancel
					</button>
					<button
						onClick={handleSave}
						className='ml-2 px-7 py-2 bg-indigo-500 text-white rounded'>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};
