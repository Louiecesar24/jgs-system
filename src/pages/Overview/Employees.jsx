import React, { useState, useEffect } from "react";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import { AddEmployee } from "./Modals/AddEmployee";
import supabase from "../../lib/supabase";
import { Toaster, toast } from "sonner";
import { EditEmployeeModal } from "./Modals/EditEmployeeModal";
import { useBranchesStore } from "../../store/data";

export const EmployeeRow = ({ employeesData, getEmployees }) => {
	const [isEdit, setIsEdit] = useState(false);

	console.log(employeesData);

	const closeEditModal = () => {
		setIsEdit(false);
	};

	const handleActivateEmployee = async (employeeData) => {
		const confirmed = confirm(
			`Are you sure you want to activate the account and record of ${
				employeeData.first_name + " " + employeeData.last_name
			}?`
		);

		if (confirmed) {
			try {
				const { error: error2 } = await supabase
					.from("users")
					.update({ is_deactivated: false })
					.eq("user_id", employeeData.user_id);

				if (error2) {
					toast.error("Error reactivating employee record. Please try again");
					return;
				}

				const { error: error3 } = await supabase
					.from("employees")
					.update({ is_deactivated: false })
					.eq("id", employeeData.id);

				if (error3) {
					toast.error("Error reactivating employee record. Please try again");
					return;
				}

				toast.success("Employee record successfully reactivated");
				getEmployees();
				return;
			} catch (err) {
				toast.error("Error reactivating an employee record.");
				return;
			}
		} else {
			toast.error("Employee Record Reactivation cancelled");
			return;
		}
	};

	const handleDeactivateEmployee = async (employeeData) => {
		const confirmed = confirm(
			`Are you sure you want to deactivate the account and record of ${
				employeeData.first_name + " " + employeeData.last_name
			}?`
		);

		if (confirmed) {
			try {
				const { error: error2 } = await supabase
					.from("users")
					.update({ is_deactivated: true })
					.eq("user_id", employeeData.user_id);

				if (error2) {
					toast.error("Error deactivating employee record. Please try again");
					return;
				}

				const { error: error3 } = await supabase
					.from("employees")
					.update({ is_deactivated: true })
					.eq("id", employeeData.id);

				if (error3) {
					toast.error("Error deactivating employee record. Please try again");
					return;
				}

				toast.success("Employee record successfully deactivated");
				getEmployees();
				return;
			} catch (err) {
				toast.error("Error deactivating an employee record.");
				return;
			}
		} else {
			toast.error("Employee Record Deactivation cancelled");
			return;
		}
	};

	return (
		<tr
			className={`bg-white border-b ${
				employeesData.is_deactivated && "grayscale-1 text-zinc-800"
			} dark:bg-gray-800 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-slate-700`}>
			<th
				scope='row'
				className='px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white'>
				{employeesData.first_name} {employeesData.last_name}
			</th>
			<td className='px-6 py-4'>{employeesData.email}</td>
			<td className='px-6 py-4'>{employeesData.phone_number}</td>
			<td className='px-6 py-4'>{employeesData.branch_name}</td>
			<td className='px-6 py-4'>{employeesData.access_point}</td>
			<td className='px-6 py-4'>{employeesData.number_of_transactions}</td>
			<td
				className={`px-6 py-4 ${
					!employeesData.is_deactivated
						? "bg-green-500 text-green-900"
						: "bg-zinc-500 text-zinc-900"
				}`}>
				{!employeesData.is_deactivated ? "Activated" : "Deactivated"}
			</td>
			<td className='px-6 py-4 flex items-center gap-2'>
				<button
					onClick={() => handleActivateEmployee(employeesData)}
					className='text-xs font-medium text-blue-600 dark:text-blue-500 hover:underline'>
					Activate
				</button>
				<button
					onClick={() => handleDeactivateEmployee(employeesData)}
					className='text-xs font-medium text-red-600 dark:text-red-500 hover:underline'>
					Deactivate
				</button>
			</td>
			{isEdit && (
				<EditEmployeeModal
					data={employeesData}
					getEmployees={getEmployees}
					closeEditModal={closeEditModal}
				/>
			)}
		</tr>
	);
};

export const Employees = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [addEmployee, setAddEmployee] = useState(false);
	const [employees, setEmployees] = useState([]);
	const [filteredEmployees, setFilteredEmployees] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const { setBranches } = useBranchesStore();
	const employeesPerPage = 7;

	const handleAddEmployee = () => {
		setAddEmployee(true);
	};

	const closeAddEmployee = () => {
		setAddEmployee(false);
	};

	const getEmployees = async () => {
		try {
			const { data: employeesData, error } = await supabase
				.from("employees")
				.select("*")
				.order("number_of_transactions", { ascending: false });

			if (error) {
				toast.error(
					"Error getting all the employees. Please check your internet connection."
				);
				return;
			}

			const branchIds = employeesData.map((employee) => employee.branch_id);
			const { data: branches, error: branchError } = await supabase
				.from("branches")
				.select("id, branch_name")
				.in("id", branchIds);

			if (branchError) {
				toast.error("Error getting branch information.");
				return;
			}

			const employeesWithBranch = employeesData.map((employee) => {
				const branch = branches.find((branch) => branch.id === employee.branch_id);
				return {
					...employee,
					branch_name: branch ? branch.branch_name : "Unknown",
				};
			});

			setEmployees(employeesWithBranch);
			setFilteredEmployees(employeesWithBranch); // Initialize the filtered employees
		} catch (err) {
			toast.error(
				"Error getting all the employees. Please check your internet connection."
			);
		}
	};

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

	useEffect(() => {
		getEmployees();
		getAllBranches();
	}, []);

	// Pagination calculations
	const indexOfLastEmployee = currentPage * employeesPerPage;
	const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
	const currentEmployees = filteredEmployees.slice(
		indexOfFirstEmployee,
		indexOfLastEmployee
	);

	const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

	const handleClick = (newPage) => {
		if (newPage > 0 && newPage <= totalPages) {
			setCurrentPage(newPage);
		}
	};

	const handleSearchChange = (e) => {
		setSearchTerm(e.target.value);
	};

	const handleSearch = () => {
		if (searchTerm.trim() === "") {
			setFilteredEmployees(employees); // Reset to all employees if search term is empty
		} else {
			const filtered = employees.filter((employee) =>
				`${employee.first_name} ${employee.last_name}`
					.toLowerCase()
					.includes(searchTerm.toLowerCase())
			);
			setFilteredEmployees(filtered);
		}
		setCurrentPage(1); // Reset to first page after search
	};

	return (
		<div className='flex h-screen overflow-hidden'>
			<Toaster
				richColors
				position='top-center'
			/>
			<Sidebar
				sidebarOpen={sidebarOpen}
				setSidebarOpen={setSidebarOpen}
			/>
			<div className='relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden'>
				<Header
					sidebarOpen={sidebarOpen}
					setSidebarOpen={setSidebarOpen}
				/>
				<main>
					<div className='px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto'>
						<div className='flex flex-col xl:flex-row justify-between items-start xl:items-center'>
							<h1 className='flex flex-col text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-5'>
								Manage Employees
								<p className='text-base font-normal'>
									Provide access to your employees by creating them an account.
								</p>
							</h1>
						</div>
						<div className='p-4 rounded-lg bg-gray-50 dark:bg-gray-800'>
							<div className='flex flex-col gap-3 2xl:flex-row 2xl:justify-between 2xl:items-center mb-2 lg:mb-8'>
								<div className='flex flex-col 2xl:flex-row items-start gap-4 2xl:items-center'>
									<h1 className='text-2xl font-bold'>Employee Records</h1>
								</div>
								<div className='flex flex-row gap-2 justify-between items-start xl:items-center'>
									<div className='relative flex items-center gap-1'>
										<input
											type='text'
											placeholder='Search'
											value={searchTerm}
											onChange={handleSearchChange}
											className='w-[15.5rem] md:w-[24.5rem] rounded-md border-gray-300 dark:border-none dark:bg-gray-700 pr-10'
										/>
										<svg
											className='absolute right-[86px] top-1/2 transform -translate-y-1/2'
											width='20'
											height='20'
											viewBox='0 0 24 24'
											fill='none'
											xmlns='http://www.w3.org/2000/svg'
											stroke='#b1b3f8'>
											<path
												d='M21 21l-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0z'
												stroke='#b1b3f8'
												stroke-width='2'
												stroke-linecap='round'
												stroke-linejoin='round'
											/>
										</svg>
										<button
											onClick={handleSearch}
											className='btn bg-indigo-500 hover:bg-indigo-600 text-white gap-2'>
											<p className='font-bold text-md'>Search</p>
										</button>
									</div>
									<button
										onClick={handleAddEmployee}
										className='btn bg-green-500 hover:bg-green-600 text-white gap-2'>
										<svg
											className='w-[20px] h-[20px]'
											viewBox='0 0 24 24'
											fill='none'
											xmlns='http://www.w3.org/2000/svg'>
											<g
												id='SVGRepo_bgCarrier'
												stroke-width='0'></g>
											<g
												id='SVGRepo_tracerCarrier'
												stroke-linecap='round'
												stroke-linejoin='round'></g>
											<g id='SVGRepo_iconCarrier'>
												<g id='Edit / Add_Plus'>
													<path
														id='Vector'
														d='M6 12H12M12 12H18M12 12V18M12 12V6'
														stroke='#ffff'
														stroke-width='2'
														stroke-linecap='round'
														stroke-linejoin='round'></path>
												</g>
											</g>
										</svg>
										<p className='hidden lg:flex sm:block font-bold text-md'>
											Add New Account
										</p>
									</button>
								</div>
							</div>
							<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
								<table className='w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400'>
									<thead className='text-xs text-white uppercase bg-indigo-500'>
										<tr>
											<th
												scope='col'
												className='px-6 py-3'>
												Employee Name
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Email
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Phone Number
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Branch Name
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Role
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												No. of Transactions
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Status
											</th>
											<th
												scope='col'
												className='px-6 py-3'>
												Action
											</th>
										</tr>
									</thead>
									<tbody>
										{currentEmployees.map((employeesData, index) => (
											<EmployeeRow
												key={index}
												getEmployees={getEmployees}
												employeesData={employeesData}
											/>
										))}
									</tbody>
								</table>
							</div>
							<div className='flex sticky justify-between items-center p-4'>
								<button
									onClick={() => handleClick(currentPage - 1)}
									className={`py-2 px-4 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 dark:hover:bg-gray-700 dark:border-gray-700 ${
										currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
									}`}
									disabled={currentPage === 1}>
									Previous
								</button>

								<p className='text-sm text-gray-700'>
									Page {currentPage} of {totalPages}
								</p>

								<button
									onClick={() => handleClick(currentPage + 1)}
									className={`py-2 px-4 text-sm font-medium text-white bg-indigo-500 rounded-md hover:bg-indigo-600 dark:hover:bg-gray-700 dark:border-gray-700 ${
										currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
									}`}
									disabled={currentPage === totalPages}>
									Next
								</button>
							</div>
						</div>
					</div>
				</main>
			</div>
			{addEmployee && (
				<AddEmployee
					isOpen={addEmployee}
					closeAddEmployee={closeAddEmployee}
					getEmployees={getEmployees}
				/>
			)}
		</div>
	);
};
