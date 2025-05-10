import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import supabase from "../../../lib/supabase";
import formatMoney from "../../../utils/formatMoney";

const ProductRow = ({ data }) => {
	return (
		<tr className='odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700'>
			<td className='px-6 py-4'>{data[0]?.customer_name}</td>
			<td className='px-6 py-4'>
				{data[0].partial_amount_paid ?? data[0]?.amount}
			</td>
			<td className='px-6 py-4'>{data[0]?.quantity ?? 0}</td>
			<td className='px-6 py-4'>{data[0]?.collector_name}</td>
			<td className='px-6 py-4'>
				{new Date(data[0]?.created_at ?? data[0]?.date_released).toLocaleDateString(
					"en-US",
					{
						month: "long",
						day: "2-digit",
						year: "numeric",
						hour: "2-digit",
						minute: "2-digit",
					}
				)}
			</td>
		</tr>
	);
};

const InspectProductModal = ({ product, setIsInspectProduct }) => {
	const [productData, setProductData] = useState();

	const handleGetAllDetailsOfProductSold = async () => {
		try {
			const { data, error } = await supabase
				.from("items")
				.select(
					`
					installments(
					customer_name,
					partial_amount_paid,
					quantity,
					collector_name,
					date_released
					),
					direct_purchases (
					customer_name,
					amount,
					quantity,
					collector_name,
					created_at
					)
					`
				)
				.eq("id", product.id)
				.order("created_at", { ascending: false });

			if (error) {
				toast.error(
					"Error retrieving data. Please check your internet connection."
				);
				return;
			}

			let details = [];
			data.map((prod) => {
				if (
					Array.isArray(prod.direct_purchases) &&
					prod.direct_purchases.length !== 0
				) {
					details.push(prod.direct_purchases);
				}

				if (Array.isArray(prod.installments) && prod.installments.length !== 0) {
					details.push(prod.installments);
				}
			});

			setProductData(details);
		} catch (err) {
			toast.error("");
		}
	};

	useEffect(() => {
		handleGetAllDetailsOfProductSold();
	}, []);
	return (
		<div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
			<Toaster
				richColors
				position='top-center'
			/>
			<div className='max-h-[550px] overflow-y-auto bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-6xl'>
				<div className='flex sm:flex-col lg:flex-row justify-between items-start'>
					<div className='flex flex-col gap-4'>
						<img
							className='p-8 rounded-t-lg w-64 h-auto'
							src={product.image_url}
							alt='product image'
						/>
						<div className='px-5 pb-5'>
							<h5 className='text-xl font-semibold tracking-tight text-gray-900 dark:text-white'>
								{product.item_name}
							</h5>
							<p>IMEI: {product.item_imei ?? "N/A"}</p>
							<p>Serial Number: {product.serial ?? "N/A"}</p>

							<p>Stock: {product.stocks}</p>
							<span>Sold: {product.number_of_sold}</span>
							<div className='flex items-center justify-between'>
								<span className='text-3xl font-bold text-gray-900 dark:text-white'>
									₱{formatMoney(product.item_price)}
								</span>
							</div>
						</div>
					</div>
					<div className='max-h-[550px] overflow-y-auto relative overflow-x-auto shadow-md sm:rounded-lg'>
						<h1 className='font-semibold my-3'>Customers who ordered this item</h1>
						<table className='w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400'>
							<thead className='text-xs text-white uppercase bg-blue-700 '>
								<tr>
									<th
										scope='col'
										className='px-6 py-3'>
										Customer Name
									</th>
									<th
										scope='col'
										className='px-6 py-3'>
										Amount
									</th>
									<th
										scope='col'
										className='px-6 py-3'>
										Quantity
									</th>
									<th
										scope='col'
										className='px-6 py-3'>
										Collector
									</th>
									<th
										scope='col'
										className='px-6 py-3'>
										Date
									</th>
								</tr>
							</thead>
							<tbody>
								{productData?.map((row, index) => (
									<ProductRow
										key={index}
										data={row}
									/>
								))}
							</tbody>
						</table>
					</div>
				</div>
				<button
					onClick={() => setIsInspectProduct(false)}
					className='btn bg-red-500 text-white'>
					Close
				</button>
			</div>
		</div>
	);
};

export default InspectProductModal;
