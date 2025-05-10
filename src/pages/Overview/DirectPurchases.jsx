import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCredStore } from "../../store/data";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import { useDirectPurchasesStore } from "../../store/data";
import { toast } from "sonner";
import supabase from "../../lib/supabase";
import { useProductLoad } from "../../store/data";
import { fetchInstallmentsAndNotify } from "../../utils/notifier";
import InspectDirectPurchaseModal from "./Modals/InspectDirectPurchaseModal";

const DirectPurchaseRow = ({ data, getPurchases }) => {
	const { cred } = useCredStore();
	const [purchaseDetails, setPurchaseDetails] = useState({});
	const [isInspect, setIsInspect] = useState(false);

	const handleCloseInspect = () => {
		setIsInspect(false);
	};

	const handleInspectPurchase = async (id) => {
		try {
			const { data, error } = await supabase
				.from("direct_purchases")
				.select(
					`
						id,
						customer_name,
						amount,
						reference_number,
						payment_method,
						remarks,
						created_at,
						direct_purchase_items (*),
						collector_name
					`
				)
				.eq("id", id)
				.single();

			if (error) {
				toast.error("Error inspecting direct purchase. Please try again");
				return;
			}

			console.log(data)
			setPurchaseDetails(data);
			setIsInspect(true);
		} catch (err) {
			toast.error("Error inspecting direct purchase. Please try again");
			return;
		}
	};

	const handleDeletePurchase = async (id) => {
		const confirmed = confirm(`Are you sure you want to delete this record?`);

		if (confirmed) {
			try {
				const { error } = await supabase
					.from("direct_purchases")
					.delete()
					.eq("id", id);

				if (error) {
					toast.error("Error deleting direct purchase. Please try again");
					return;
				}

				const { error: logError } = await supabase.from("logs").insert({
					log_label: `${cred.name} deleted a direct purchase.`,
					log_category: "Action",
					user_id: cred.user_id,
				});

				if (logError) {
					toast.error("Error deleting direct purchase. Please try again");
					return;
				}

				toast.success("Direct Purchase successfully deleted.");
				getPurchases();
				return;
			} catch (err) {
				toast.error("Error deleting direct purchase. Please try again");
				return;
			}
		} else {
			toast.warning("Direct Purchase deletion canceled.");
			return;
		}
	};
	return (
		<>
			<tr className='odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700'>
				<th
					scope='row'
					className='px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white'>
					{new Date(data?.created_at).toLocaleDateString("en-US", {
						month: "long",
						day: "2-digit",
						year: "numeric",
						hour: "2-digit",
						minute: "2-digit",
					})}
				</th>
				<td className='px-6 py-4'>{data?.customer_name}</td>

				<td className='px-6 py-4'>{data?.amount}</td>
				<td className='px-6 py-4'>{data?.payment_method}</td>
				<td className='px-6 py-4'>{data?.reference_number}</td>
				<td className='px-6 py-4'>{data?.collector_name}</td>
				<td className='px-6 py-4 flex gap-2 items-center'>
					<button
						onClick={() => handleInspectPurchase(data?.id)}
						className='bg-blue-500 text-white font-medium px-3 rounded-md hover:shadow-md'>
						Inspect
					</button>
					<button
						onClick={() => handleDeletePurchase(data?.id)}
						className='bg-red-500 text-white font-medium px-3 rounded-md hover:shadow-md'>
						Delete
					</button>
				</td>
			</tr>

			{isInspect && (
				<InspectDirectPurchaseModal
					details={purchaseDetails}
					handleCloseModal={handleCloseInspect}
				/>
			)}
		</>
	);
};

const DirectPurchases = () => {
	const location = useLocation();
	const { cred } = useCredStore();
	const { directPurchases, setDirectPurchases } = useDirectPurchasesStore();
	const token = localStorage.getItem("token");
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [isAdd, setIsAdd] = useState(false);
	const [lastPage, setLastPage] = useState(0);
	const itemsPerPage = 6;
	const { loadProduct } = useProductLoad();

	const getPurchases = async () => {
		try {
			const { count, data, error } = await supabase
				.from("direct_purchases")
				.select(
					`
														id,
														customer_name,
														amount,
														reference_number,
														payment_method,
														remarks,
														user_id,
														item_id,
														branch_id,
														quantity,
														created_at,
														items (*),
														collector_name
										`,
					{ count: "exact" }
				)
				.eq("branch_id", cred.branch_id)
				.order("created_at", { ascending: false })
				.range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

			if (error) {
				toast.error(
					"Error retrieving direct purchases. Please check your internet connection"
				);
				return;
			}

			const formattedData = data.map((purchase) => ({
				id: purchase.id,
				customer_name: purchase.customer_name,
				amount: purchase.amount,
				reference_number: purchase.reference_number,
				payment_method: purchase.payment_method,
				quantity: purchase.quantity,
				remarks: purchase.remarks,
				user_id: purchase.user_id,
				item_id: purchase.item_id,
				branch_id: purchase.branch_id,
				created_at: purchase.created_at,
				items: purchase.items,
				collector_name: purchase.collector_name || "Unknown",
			}));

			setDirectPurchases(formattedData);
			setLastPage(Math.ceil(count / itemsPerPage));
		} catch (err) {
			console.error(err);
			throw new Error("Error retrieving direct purchases");
		}
	};

	const handleCloseModal = () => {
		setIsAdd(false);
	};

	const handleClick = (newPage) => {
		if (newPage >= 1 && newPage <= lastPage) {
			setCurrentPage(newPage);
		}
	};

	useEffect(() => {
		if (cred.role === "admin") getPurchases();
	}, [currentPage]);

	useEffect(() => {
		loadProduct();
	}, [loadProduct]);

	useEffect(() => {
		if (cred.role === "admin") fetchInstallmentsAndNotify(cred.branch_id);
	}, []);

	useEffect(() => {
		if (location?.state?.directPurchase) setIsAdd(true);
	}, [location?.state]);

	return (
		<div className='flex h-screen overflow-hidden'>
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
						<div className='flex justify-between items-center'>
							<div className='flex flex-col xl:flex-row justify-between items-start xl:items-center'>
								<h1 className='flex flex-col text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-5'>
									Direct Purchases
									<p className='text-base font-normal'>
										These are the direct purchases from your customer. No installments are
										made from these.
									</p>
								</h1>
							</div>
							<Link to='/dashboard/add-direct-purchases'>
								<button className='btn h-12 bg-indigo-500 hover:bg-indigo-600 text-white'>
									Add Purchase
								</button>
							</Link>
						</div>
						<div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
							<table className='w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400'>
								<thead className='text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400'>
									<tr>
										<th
											scope='col'
											className='px-6 py-3'>
											Date Collected
										</th>
										<th
											scope='col'
											className='px-6 py-3'>
											Customer Name
										</th>

										<th
											scope='col'
											className='px-6 py-3'>
											Total Amount
										</th>

										<th
											scope='col'
											className='px-6 py-3'>
											Payment Method
										</th>
										<th
											scope='col'
											className='px-6 py-3'>
											Reference Number
										</th>

										<th
											scope='col'
											className='px-6 py-3'>
											Collector Name
										</th>
										<th
											scope='col'
											className='px-6 py-3'>
											Action
										</th>
									</tr>
								</thead>
								<tbody>
									{directPurchases?.map((row, index) => (
										<DirectPurchaseRow
											getPurchases={getPurchases}
											key={index}
											data={row}
										/>
									))}
								</tbody>
							</table>
							<div className='flex justify-between items-center p-4'>
								<button
									className='btn bg-indigo-500 hover:bg-indigo-600 text-white'
									onClick={() => handleClick(currentPage - 1)}
									disabled={currentPage === 1}>
									Previous
								</button>
								<span>
									Page {currentPage} of {lastPage}
								</span>
								<button
									className={`btn bg-indigo-500 hover:bg-indigo-600 text-white ${
										currentPage === lastPage && "bg-indigo-200"
									}`}
									onClick={() => handleClick(currentPage + 1)}
									disabled={currentPage === lastPage}>
									Next
								</button>
							</div>
						</div>
						{/**
						* 
							<div className='mt-5'>
							<div className='flex flex-col xl:flex-row justify-between items-start xl:items-center'>
								<h1 className='flex flex-col text-xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-5'>
									Discount
									<p className='text-base font-normal'>Work in Progress</p>
								</h1>
							</div>
						</div>
					 */}
					</div>
				</main>
			</div>
		</div>
	);
};

export default DirectPurchases;
