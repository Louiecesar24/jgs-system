import React, { useState } from "react";
import { useBranchesStore } from "../../../store/data";
import { toast, Toaster } from "sonner";
import supabase from "../../../lib/supabase";

export const Units = ({ units }) => {
	return (
		<option
			value={units.id}
			className='text-black dark:text-gray-200 h-full overflow-y-scroll'>
			{units.branch_name}
		</option>
	);
};

const AccessPointDropdown = ({ access_point }) => {
	return (
		<option
			value={access_point}
			className='text-black dark:text-gray-200 h-full overflow-y-scroll'>
			{access_point}
		</option>
	);
};

export const EditEmployeeModal = ({ data, closeEditModal, getEmployees }) => {
	const token = localStorage.getItem("token");
	const { branches } = useBranchesStore();
	const [details, setDetails] = useState({
		first_name: "",
		last_name: "",
		phone_number: "",
		branch_id: 1,
		access_point: "admin",
	});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setDetails((prevDetails) => ({
			...prevDetails,
			[name]: value,
		}));
	};

	console.log(details);

	const handleBranchChange = (e) => {
		setDetails((prevDetails) => ({
			...prevDetails,
			branch_id: e.target.value,
		}));
	};

	const handleAccessPointChange = (e) => {
		setDetails((prevDetails) => ({
			...prevDetails,
			access_point: e.target.value,
		}));
	};

	const handleEditEmployee = async () => {
		try {
			const { error: userError } = await supabase
				.from("users")
				.update({
					first_name: details.first_name ?? data.first_name,
					last_name: details.last_name ?? data.last_name,
					phone_number: details.phone_number ?? data.phone_number,
					role: details.access_point ?? data.access_point,
					branch_id: Number(details.branch_id) ?? Number(data.branch_id),
				})
				.eq("user_id", data.user_id || "");

			if (userError) {
				toast.error("Error editing employee record. Please try again.");
				return;
			}

			const { error: employeeError } = await supabase
				.from("employees")
				.update({
					first_name: details.first_name ?? data.first_name,
					last_name: details.last_name ?? data.last_name,
					phone_number: details.phone_number ?? data.phone_number,
					access_point: details.access_point ?? data.access_point,
					branch_id: Number(details.branch_id) ?? Number(data.branch_id),
				})
				.eq("id", data.id);

			if (employeeError) {
				toast.error("Error editing employee record. Please try again.");
				return;
			}

			toast.success("Employee record updated successfully.");
			closeAddEmployee();
			getEmployees();
		} catch (err) {
			console.error(err.message);
			alert("Error creating cashier's account.");
			return;
		}
	};

	return (
		<div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
			<Toaster
				position='top-center'
				richColors
			/>
			<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-4xl max-h-full'>
				<h2 className='text-2xl text-black font-semibold dark:text-white mb-4'>
					Edit Employee
				</h2>
				<hr className='mb-4' />
				<div className='flex gap-4'>
					<div className='mb-4 w-full'>
						<label className='block mb-2 dark:text-white font-medium'>
							First Name
						</label>
						<input
							name='first_name'
							type='text'
							placeholder={data.first_name}
							onChange={handleChange}
							className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
						/>
					</div>
					<div className='mb-4 w-full'>
						<label className='block mb-2 dark:text-white font-medium'>
							Last Name
						</label>
						<input
							name='last_name'
							type='text'
							placeholder={data.last_name}
							onChange={handleChange}
							className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
						/>
					</div>
				</div>
				<div className='flex gap-4'>
					<div className='mb-4 w-full'>
						<label className='block mb-2 dark:text-white font-medium'>
							Phone Number
						</label>
						<input
							name='phone_number'
							type='tel'
							value={details.phone_number}
							onChange={handleChange}
							className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
						/>
					</div>
				</div>

				<div className='flex gap-4'>
					<div className='relative mb-4 w-full'>
						<label className='block mb-2 dark:text-white font-medium'>
							Permission Level
						</label>
						<select
							name='access_point'
							className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md cursor-pointer'
							value={details.access_point || data.access_point}
							onChange={handleAccessPointChange}>
							<option
								value=''
								className='text-gray-400'>
								--Access Point--
							</option>
							{["admin", "super"].map((access_point, index) => (
								<AccessPointDropdown
									access_point={access_point}
									key={index}
								/>
							))}
						</select>
					</div>
					<div className='relative mb-4 w-full'>
						<label className='block mb-2 dark:text-white font-medium'>
							Branch Name
						</label>
						<select
							id='unitItems'
							name='branch_id'
							className={`border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md cursor-pointer ${
								!details.branch_id ? "text-gray-300" : "text-black"
							}`}
							value={details.branch_id || ""}
							onChange={handleBranchChange}>
							<option
								value=''
								className='text-gray-400'>
								--Choose Branch Name--
							</option>
							{branches.map((units, index) => (
								<Units
									units={units}
									key={index}
								/>
							))}
						</select>
					</div>
				</div>
				<div className='flex justify-end'>
					<button
						onClick={closeEditModal}
						className='px-4 py-2 text-white bg-gray-400 rounded'>
						Cancel
					</button>
					<button
						onClick={handleEditEmployee}
						className='ml-2 px-7 py-2 bg-green-500 text-white rounded'>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};
