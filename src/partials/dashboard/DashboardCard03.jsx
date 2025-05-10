import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import LineChart from "../../charts/LineChart01";
import Icon from "../../images/icon-03.svg";
import EditMenu from "../../components/DropdownEditMenu";

// Import utilities
import { tailwindConfig, hexToRGB } from "../../utils/Utils";

function DashboardCard03() {
	const navigate = useNavigate();

	const handleRedirect = (type) => {
		console.log(type);
		if (type === "direct_purchase") {
			navigate("/dashboard/direct-purchases", { state: { directPurchase: true } });
		} else {
			navigate("/installments", { state: { installment: true } });
		}
	};

	return (
		<div className='flex flex-col col-span-full sm:col-span-6 xl:col-span-4 bg-white dark:bg-slate-800 shadow-lg rounded-sm border border-slate-200 dark:border-slate-700'>
			<div className='px-5 py-5'>
				<header className='flex justify-between items-start mb-2'>
					{/* Icon */}
					<img
						src={Icon}
						width='32'
						height='32'
						alt='Icon 03'
					/>
				</header>
				<h2 className='text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2'>
					ACTIONS TO ACCEPT PURCHASES
				</h2>
				<div className='text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1'>
					Click one of the buttons to accept new transactions
				</div>
				<div className='flex items-start gap-3'>
					<button
						onClick={() => handleRedirect("direct_purchase")}
						className='btn bg-blue-500 gap-2 text-white font-semibold rounded-md py-2 px-3'>
						<svg
							className='w-[20px] h-[20px]'
							viewBox='0 0 24 24'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'>
							<path
								d='M12 4v16m8-8H4'
								stroke='#ffffff'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</svg>
						Direct Purchase
					</button>
					<button
						onClick={() => handleRedirect("installment")}
						className='btn bg-green-500 gap-2 text-white font-semibold rounded-md py-2 px-3'>
						<svg
							className='w-[20px] h-[20px]'
							viewBox='0 0 24 24'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'>
							<path
								d='M12 4v16m8-8H4'
								stroke='#ffffff'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</svg>
						Installment
					</button>
				</div>
			</div>
		</div>
	);
}

export default DashboardCard03;
