import React, { useState, useEffect } from "react";
import { useProductStore } from "../store/data";
import { useCredStore } from "../store/data";
import { useBranchesStore } from "../store/data";
import supabase from "../lib/supabase";

import Sidebar from "../partials/Sidebar";
import Header from "../partials/Header";
import WelcomeBanner from "../partials/dashboard/WelcomeBanner";
import FilterButton from "../components/DropdownFilter";
import Datepicker from "../components/Datepicker";
import DashboardCard01 from "../partials/dashboard/DashboardCard01";
import DashboardCard02 from "../partials/dashboard/DashboardCard02";
import DashboardCard03 from "../partials/dashboard/DashboardCard03";
import DashboardCard04 from "../partials/dashboard/DashboardCard04";
import DashboardCard05 from "../partials/dashboard/DashboardCard05";
import DashboardCard06 from "../partials/dashboard/DashboardCard06";
// import DashboardCard07 from "../partials/dashboard/DashboardCard07";
// import DashboardCard08 from "../partials/dashboard/DashboardCard08";
// import DashboardCard09 from "../partials/dashboard/DashboardCard09";
// import DashboardCard10 from "../partials/dashboard/DashboardCard10";
import DashboardCard11 from "../partials/dashboard/DashboardCard11";
import DashboardCard12 from "../partials/dashboard/DashboardCard12";
import DashboardCard13 from "../partials/dashboard/DashboardCard13";
import { toast } from "sonner";
import { fetchInstallmentsAndNotify } from "../utils/notifier";

function Dashboard() {
	const token = localStorage.getItem("token");
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { setBranches } = useBranchesStore();
	const { cred } = useCredStore((state) => ({
		cred: state.cred,
	}));
	const { setProductGroups, setProducts } = useProductStore();

	const getAllBranches = async () => {
		try {
			const { data, error } = await supabase.from("branches").select("*");

			if (error) {
				toast.error(
					"Error retrieving all branches. Check your internet connection and try again."
				);
				return;
			}

			setBranches(data);
		} catch (err) {
			console.log(err);
			alert("Error getting all branches. Please try again.");
			return;
		}
	};

	const handleGetProductGroupsAndItems = async () => {
		try {
			const { data: productData, error: productError } = await supabase
				.from("products")
				.select("*")
				.eq("branch_id", cred?.branch_id);

			if (productError) {
				handleError(
					"Error retrieving product groups. Please check your internet connection and try again."
				);
				return;
			}

			setProductGroups(productData);

			if (productData.length > 0) {
				const productIds = productData.map((product) => product.id);
				const { data: itemsData, error: itemsError } = await supabase
					.from("items")
					.select("*")
					.in("product_id", productIds);

				if (itemsError) {
					handleError(
						"Error retrieving items. Please check your internet connection and try again."
					);
					return;
				}

				setProducts(itemsData);
			}
		} catch (err) {
			console.log(err);
			alert("Error retrieving product groups and items");
		}
	};

	useEffect(() => {
		if (cred.role === "admin") {
			handleGetProductGroupsAndItems();
			fetchInstallmentsAndNotify(cred.branch_id);
		}

		if (cred.role === "super") getAllBranches();
	}, []);

	return (
		<div className='flex h-screen overflow-hidden'>
			{/* Sidebar */}
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
						{/* Welcome banner */}
						<WelcomeBanner />

						{/* Dashboard actions */}

						{/* Cards */}
						<div className='grid grid-cols-12 gap-6'>
							{/* Daily Sales */}
							<DashboardCard01 />
							{/* All sales */}
							{cred.role === "super" && <DashboardCard04 />}
							{/* Expenses */}
							<DashboardCard02 />
							{/* Actions */}
							{cred.role === "admin" && <DashboardCard03 />}
							{/*
						{/* Bar chart (Direct vs Indirect) */}
							{/*
							{/* Line chart (Real Time Value) */}

							{/*
							<DashboardCard05 />
							{/* Doughnut chart (Top Countries) */}
							{/*
							<DashboardCard06 />
							{/* Table (Top Channels) */}
							{/*
							<DashboardCard07 />
							{/* Line chart (Sales Over Time) */}
							{/*
							<DashboardCard08 />
							{/* Stacked bar chart (Sales VS Refunds) */}
							{/*
							<DashboardCard09 />
							{/* Card (Customers) */}
							{/*

							{/*
							{/* Card (Recent Activity) */}
							{cred.role === "super" && <DashboardCard12 />}
							{cred.role === "admin" && <DashboardCard05 />}
							{cred.role === "admin" && <DashboardCard06 />}
							{/*
							{/* Card (Income/Expenses) */}
							{/*
							 */}
							{cred.role === "super" && <DashboardCard11 />}
							<DashboardCard13 />
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}

export default Dashboard;
