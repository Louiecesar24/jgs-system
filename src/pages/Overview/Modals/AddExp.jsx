import React, { useState } from "react";
import { useCredStore } from "../../../store/data";
import supabase from "../../../lib/supabase";
import { toast, Toaster } from "sonner";

export const AddExp = ({ closeAddModal, handleGetExpenses }) => {
	const token = localStorage.getItem("token");
	const { cred } = useCredStore();
	const [amount, setAmount] = useState();
	const [remarks, setRemarks] = useState();

	const handleAddNewExpenses = async () => {
		if (!amount && !remarks) {
			alert("Please fill all the fields");
			return;
		}

		try {
			const { error } = await supabase.from("expenses").insert({
				amount: amount,
				remarks: remarks,
				branch_id: cred.branch_id,
				employee_name: cred.name,
			});

			if (error) {
				toast.error("Error adding new expense");
				return;
			}

			toast.success("Added new expenses successfully!");

			handleGetExpenses();
			closeAddModal();
		} catch (err) {
			console.log(err);
			throw new Error("Error adding new expenses");
		}
	};

	return (
		<div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
			<Toaster
				richColors
				position='top-center'
			/>
			<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-md max-h-full'>
				<h2 className='text-2xl text-black font-semibold dark:text-white mb-4'>
					Add Expense
				</h2>
				<hr className='mb-4'></hr>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white'>Amount</label>
					<input
						type='number'
						onChange={(e) => setAmount(e.target.value)}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white'>Remarks</label>
					<textarea
						onChange={(e) => setRemarks(e.target.value)}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='flex justify-end'>
					<button
						onClick={closeAddModal}
						className='px-4 py-2 text-white bg-gray-400 rounded'>
						Cancel
					</button>
					<button
						onClick={handleAddNewExpenses}
						className='ml-2 px-7 py-2 bg-indigo-500 text-white rounded'>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};
