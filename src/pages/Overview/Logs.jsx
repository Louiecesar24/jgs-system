import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import logo from "../../../src/assets/jgs_logo.png";
import supabase from "../../lib/supabase";
import { toast, Toaster } from "sonner";
import { debounce } from "lodash";

export const Log = ({ log }) => {
	return (
		<>
			<ol class='mt-3 divide-y divider-gray-200 dark:divide-gray-700'>
				<li>
					<a
						href='#'
						class='items-center block p-3 sm:flex hover:bg-gray-100 dark:hover:bg-gray-700'>
						<img
							class='w-12 h-12 mb-3 me-3 rounded-full sm:mb-0'
							src={logo}
							alt='JGs POS Logo'
						/>
						<div class='text-gray-600 dark:text-gray-400'>
							<div class='text-base font-normal'>
								<span class='font-medium text-gray-900 dark:text-white'>
									{log.log_label}
								</span>
							</div>
							<div class='text-sm font-normal'>{log.log_category}</div>
							<span class='inline-flex items-center text-xs font-normal text-gray-500 dark:text-gray-400'>
								<svg
									class='w-2.5 h-2.5 me-1'
									aria-hidden='true'
									xmlns='http://www.w3.org/2000/svg'
									fill='currentColor'
									viewBox='0 0 20 20'>
									<path d='M10 .5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19ZM8.374 17.4a7.6 7.6 0 0 1-5.9-7.4c0-.83.137-1.655.406-2.441l.239.019a3.887 3.887 0 0 1 2.082 2.5 4.1 4.1 0 0 0 2.441 2.8c1.148.522 1.389 2.007.732 4.522Zm3.6-8.829a.997.997 0 0 0-.027-.225 5.456 5.456 0 0 0-2.811-3.662c-.832-.527-1.347-.854-1.486-1.89a7.584 7.584 0 0 1 8.364 2.47c-1.387.208-2.14 2.237-2.14 3.307a1.187 1.187 0 0 1-1.9 0Zm1.626 8.053-.671-2.013a1.9 1.9 0 0 1 1.771-1.757l2.032.619a7.553 7.553 0 0 1-3.132 3.151Z' />
								</svg>
								{new Date(log.created_at).toLocaleDateString("en-US", {
									year: "numeric",
									month: "long",
									day: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})}
							</span>
						</div>
					</a>
				</li>
			</ol>
		</>
	);
};

export const Activity = ({ logsData }) => {
	return (
		<>
			<div className='p-5 mb-4 border border-gray-100 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 shadow-md'>
				<time class='text-lg font-semibold text-gray-900 dark:text-white'>
					{logsData.date}
				</time>

				{logsData.logs.map((log, index) => (
					<Log
						key={index}
						log={log}
					/>
				))}
			</div>
		</>
	);
};

function Logs() {
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [logsMessage, setLogsMessage] = useState([]);
	const [searchLog, setSearchLog] = useState("");

	const getLogs = async () => {
		try {
			const { data, error } = await supabase
				.from("logs")
				.select("*")
				.order("created_at", { ascending: false });

			if (error) {
				throw new Error(error.message);
			}

			setLogsMessage(data);
		} catch (err) {
			console.error("Error retrieving logs:", err);
			toast.error("Error getting all logs. Please try again later.");
		}
	};

	const handleSearchLog = () => {
		const filteredLogs = logsMessage.filter((log) => {
			return log.log_label.toLowerCase().includes(searchLog.toLowerCase());
		});

		setLogsMessage(filteredLogs);
	};

	const debouncedSearch = useCallback(
		debounce(() => {
			if (searchLog === "") {
				getLogs();
			} else {
				handleSearchLog();
			}
		}, 300),
		[searchLog]
	);

	useEffect(() => {
		debouncedSearch();
	}, [logsMessage, searchLog, debouncedSearch]);

	useEffect(() => {
		getLogs();
	}, []);

	return (
		<div className='flex h-screen overflow-hidden'>
			<Toaster
				richColors
				position='top-center'
			/>
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
								Activity Logs
								<p className='text-base font-normal'>
									Check the transaction history from all of your branches.
								</p>
							</h1>
							<input
								type='text'
								placeholder='Search Transaction History by Employee Name'
								value={searchLog}
								onChange={(e) => setSearchLog(e.target.value)}
								className=' border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 w-full lg:w-[600px] dark:bg-slate-700 dark:text-white'
							/>
						</div>
						<div className='p-4 rounded-lg bg-gray-50 dark:bg-gray-800'>
							{Array.isArray(logsMessage) && logsMessage.length > 0 ? (
								logsMessage.map((log, index) => (
									<Log
										key={log.id}
										log={log}
									/>
								))
							) : (
								<p>No logs available.</p>
							)}
						</div>
					</div>
				</main>
			</div>
		</div>
	);
}

export default Logs;
