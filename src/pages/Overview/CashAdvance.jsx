import React, { useState } from "react";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";

const CashAdvance = () => {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [isAdd, setIsAdd] = useState(false);
	const [lastPage, setLastPage] = useState(0);

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
						<div className='flex flex-col xl:flex-row justify-between items-start xl:items-center'>
							<h1 className='flex flex-col text-2xl md:text-3xl text-slate-800 dark:text-slate-100 font-bold mb-5'>
								Cash Advance
								<p className='text-base font-normal'>
									Manage the cash advance for your employees. (WORK IN PROGRESS)
								</p>
							</h1>
						</div>
					</div>
				</main>
			</div>
		</div>
	);
};

export default CashAdvance;
