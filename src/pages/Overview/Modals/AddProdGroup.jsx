import React, { useState } from "react";
import { useCredStore } from "../../../store/data";
import supabase from "../../../lib/supabase";
import { toast } from "sonner";

export const AddProdGroup = ({
	closeAddProdGroupModal,
	handleGetProductGroupsAndItems,
}) => {
	const token = localStorage.getItem("token");
	const { cred } = useCredStore();
	const [prodName, setProdName] = useState("");

	const handleCreateProdGroup = async () => {
		if (!prodName || prodName === "") {
			alert("Please enter a product name!");
			return;
		}
		try {
			const { error } = await supabase.from("products").insert({
				product_group: prodName,
				branch_id: cred.branch_id,
			});

			if (error) {
				toast.error("Error adding new product group. Please try again.");
				return;
			}
			toast.success(`Successfully added ${prodName} group`);
			closeAddProdGroupModal();
			handleGetProductGroupsAndItems();
		} catch (err) {
			console.error(err);
			alert("Error adding new product group.");
			return;
		}
	};

	return (
		<div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
			<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-md max-h-full'>
				<h2 className='text-2xl text-black font-semibold dark:text-white mb-4'>
					Add Product Group
				</h2>
				<hr className='mb-4'></hr>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white'>Product Group Name</label>
					<input
						type='text'
						onChange={(e) => setProdName(e.target.value)}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='flex justify-end'>
					<button
						onClick={closeAddProdGroupModal}
						className='px-4 py-2 text-white bg-gray-400 rounded'>
						Cancel
					</button>
					<button
						onClick={handleCreateProdGroup}
						className='ml-2 px-7 py-2 bg-indigo-500 text-white rounded'>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};
