import React, { useState, useEffect } from "react";
import { useBranchesStore } from "../../store/data";
import { useCredStore } from "../../store/data";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import supabase from "../../lib/supabase";
import { Toaster, toast } from "sonner";
import { useProductLoad } from "../../store/data";

const AddBranchModal = ({ setIsCreate, token, getAllBranches }) => {
	const [branchName, setBranchName] = useState("");
	const [branchAddress, setBranchAddress] = useState("");
	const [branchPhone, setBranchPhone] = useState("");
	const { loadProduct } = useProductLoad();

	const handleAddBranch = async () => {
		if (!branchName || !branchAddress || !branchPhone) {
			toast.error("Please fill out all the inputs.");
			return;
		}

		try {
			const { error } = await supabase.from("branches").insert({
				branch_name: branchName,
				branch_address: branchAddress,
				branch_contact_number: branchPhone,
				branch_total_sales: 0,
			});

			if (error) {
				toast.error("Error saving new branch. Please try again.");
				return;
			}

			getAllBranches();
			toast.success("Successfully added new branch");
			setIsCreate(false);
			return;
		} catch (err) {
			console.log(err);
			alert("Error adding new branch. Try again.");
			return;
		}
	};

	useEffect(() => {
		loadProduct();
	}, [loadProduct]);

	return (
		<div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
			<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-md max-h-full'>
				<h2 className='text-2xl text-black font-semibold dark:text-white mb-4'>
					Create New Branch
				</h2>
				<hr className='mb-4'></hr>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white'>Branch Name</label>
					<input
						type='text'
						onChange={(e) => setBranchName(e.target.value)}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white'>Branch Address</label>
					<textarea
						onChange={(e) => setBranchAddress(e.target.value)}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='mb-4'>
					<label className='block mb-2 dark:text-white'>
						Branch Contact Number{" "}
						<span className='text-zinc-400 text-xs'>(09123456789)</span>
					</label>
					<input
						type='text'
						onChange={(e) => setBranchPhone(e.target.value)}
						className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
					/>
				</div>
				<div className='flex justify-end'>
					<button
						onClick={() => setIsCreate(false)}
						className='px-4 py-2 text-white bg-gray-400 rounded'>
						Cancel
					</button>
					<button
						onClick={handleAddBranch}
						className='ml-2 px-7 py-2 bg-indigo-500 text-white rounded'>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};

const Branches = () => {
	const token = localStorage.getItem("token");
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [isCreate, setIsCreate] = useState(false);
	const { branches, setBranches } = useBranchesStore();
	const { cred } = useCredStore();

	const getAllBranches = async () => {
		try {
			const { data, error } = await supabase.from("branches").select("*");

			if (error) {
				toast.error("Error getting all branches");
				return;
			}

			setBranches(data);
		} catch (err) {
			console.log(err);
			alert("Error getting all branches. Please try again.");
			return;
		}
	};

	const handleDeleteBranch = async (branchName, id) => {
		const confirmed = confirm(
			`Are you sure you want to delete the branch "${branchName}"?`
		);

		if (confirmed) {
			try {
				console.log(id);
				const { err } = await supabase.from("branches").delete().eq("id", id);

				if (err) {
					toast.error("Error deleting branch");
					return;
				}

				toast.success("Branch deleted successfully!");
				getAllBranches();
			} catch (err) {
				console.error(err);
				toast.error("Error deleting branch.");
			}
		} else {
			console.log("Deletion canceled.");
		}
	};

	useEffect(() => {
		getAllBranches();
	}, []);

	return (
		<div className='flex h-screen overflow-hidden'>
			{/* Sidebar */}
			<Toaster
				richColors
				position='top-center'
			/>
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
					<div className='px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto'>
						<div className='flex justify-between items-center'>
							<div className='flex flex-col xl:flex-row justify-between items-start xl:items-center'>
								<h1 className='flex flex-col text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-5'>
									Branches
									<p className='text-base font-normal'>
										These are all the branches for JGs Applianshoppe. You can add new
										branch by clicking the Add New Branch
									</p>
								</h1>
							</div>
							<button
								onClick={() => setIsCreate(true)}
								className='btn h-12 bg-indigo-500 hover:bg-indigo-600 text-white'>
								Add New Branch
							</button>
						</div>

						<div className='grid grid-cols-12 gap-6'>
							{branches?.map((branch, idx) => {
								return (
									<div
										key={idx}
										className='flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-slate-800 shadow-lg rounded-md border border-slate-200 dark:border-slate-700'>
										<div className='px-5 py-5'>
											<div className='flex justify-between items-center'>
												<h1 className='text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2'>
													{branch?.branch_name}
												</h1>
												{branch.id !== 1 && (
													<button
														onClick={() =>
															handleDeleteBranch(branch?.branch_name, branch?.id)
														}
														className='px-2 py-1 rounded-md bg-red-500 text-white'>
														Delete
													</button>
												)}
											</div>
											<div className='text-lg font-semibold text-slate-500 dark:text-slate-500 uppercase mb-1'>
												{branch?.branch_address}
											</div>
											<div className='text-md font-bold text-slate-400 dark:text-slate-100 mr-2'>
												{branch?.branch_contact_number}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</main>
			</div>

			{isCreate && (
				<AddBranchModal
					token={token}
					setIsCreate={setIsCreate}
					getAllBranches={getAllBranches}
				/>
			)}
		</div>
	);
};

export default Branches;
