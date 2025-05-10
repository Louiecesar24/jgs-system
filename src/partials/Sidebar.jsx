import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/jgs_logo.png";
import { useCredStore } from "../store/data";

import SidebarLinkGroup from "./SidebarLinkGroup";

function Sidebar({ sidebarOpen, setSidebarOpen }) {
	const { cred } = useCredStore();
	const location = useLocation();
	const { pathname } = location;

	const trigger = useRef(null);
	const sidebar = useRef(null);

	const storedSidebarExpanded = localStorage.getItem("sidebar-expanded");
	const [sidebarExpanded, setSidebarExpanded] = useState(
		storedSidebarExpanded === null ? false : storedSidebarExpanded === "true"
	);

	// close on click outside
	useEffect(() => {
		const clickHandler = ({ target }) => {
			if (!sidebar.current || !trigger.current) return;
			if (
				!sidebarOpen ||
				sidebar.current.contains(target) ||
				trigger.current.contains(target)
			)
				return;
			setSidebarOpen(false);
		};
		document.addEventListener("click", clickHandler);
		return () => document.removeEventListener("click", clickHandler);
	});

	useEffect(() => {
		const keyHandler = ({ keyCode }) => {
			if (!sidebarOpen || keyCode !== 27) return;
			setSidebarOpen(false);
		};
		document.addEventListener("keydown", keyHandler);
		return () => document.removeEventListener("keydown", keyHandler);
	});

	useEffect(() => {
		localStorage.setItem("sidebar-expanded", sidebarExpanded);
		if (sidebarExpanded) {
			document.querySelector("body").classList.add("sidebar-expanded");
		} else {
			document.querySelector("body").classList.remove("sidebar-expanded");
		}
	}, [sidebarExpanded]);

	return (
		<div>
			{/* Sidebar backdrop (mobile only) */}
			<div
				className={`fixed inset-0 bg-slate-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
					sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
				}`}
				aria-hidden='true'></div>

			{/* Sidebar */}
			<div
				id='sidebar'
				ref={sidebar}
				className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 h-screen overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:!w-64 shrink-0 bg-slate-800 p-4 transition-all duration-200 ease-in-out ${
					sidebarOpen ? "translate-x-0" : "-translate-x-64"
				}`}>
				{/* Sidebar header */}
				<div className='flex justify-between mb-10 pr-3 sm:px-2'>
					{/* Close button */}
					<button
						ref={trigger}
						className='lg:hidden text-slate-500 hover:text-slate-400'
						onClick={() => setSidebarOpen(!sidebarOpen)}
						aria-controls='sidebar'
						aria-expanded={sidebarOpen}>
						<span className='sr-only'>Close sidebar</span>
						<svg
							className='w-6 h-6 fill-current'
							viewBox='0 0 24 24'
							xmlns='http://www.w3.org/2000/svg'>
							<path d='M10.7 18.7l1.4-1.4L7.8 13H20v-2H7.8l4.3-4.3-1.4-1.4L4 12z' />
						</svg>
					</button>
					{/* Logo */}
					<NavLink
						end
						to='/dashboard'
						className='block'>
						<img
							src={logo}
							alt='JGs Logo'
							className='w-10 h-10'
						/>
					</NavLink>
				</div>

				{/* Links */}
				<div className='space-y-8'>
					{/* Pages group */}
					<div>
						<h3 className='text-xs uppercase text-slate-500 font-semibold pl-3'>
							<span
								className='hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6'
								aria-hidden='true'>
								•••
							</span>
							<span className='lg:hidden lg:sidebar-expanded:block 2xl:block'>
								Pages
							</span>
						</h3>
						<ul className='mt-3'>
							{/* Dashboard */}
							<SidebarLinkGroup
								activecondition={pathname === "/" || pathname.includes("dashboard")}>
								{(handleClick, open) => {
									return (
										<React.Fragment>
											<a
												href='#0'
												className={`block text-slate-200 truncate transition duration-150 ${
													pathname === "/" || pathname.includes("dashboard")
														? "hover:text-slate-200"
														: "hover:text-white"
												}`}
												onClick={(e) => {
													e.preventDefault();
													sidebarExpanded ? handleClick() : setSidebarExpanded(true);
												}}>
												<div className='flex items-center justify-between'>
													<div className='flex items-center'>
														<svg
															className='shrink-0 h-6 w-6'
															viewBox='0 0 24 24'>
															<path
																className={`fill-current ${
																	pathname === "/" || pathname.includes("dashboard")
																		? "text-yellow-500"
																		: "text-slate-400"
																}`}
																d='M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0z'
															/>
															<path
																className={`fill-current ${
																	pathname === "/" || pathname.includes("dashboard")
																		? "text-yellow-600"
																		: "text-slate-600"
																}`}
																d='M12 3c-4.963 0-9 4.037-9 9s4.037 9 9 9 9-4.037 9-9-4.037-9-9-9z'
															/>
															<path
																className={`fill-current ${
																	pathname === "/" || pathname.includes("dashboard")
																		? "text-yellow-200"
																		: "text-slate-400"
																}`}
																d='M12 15c-1.654 0-3-1.346-3-3 0-.462.113-.894.3-1.285L6 6l4.714 3.301A2.973 2.973 0 0112 9c1.654 0 3 1.346 3 3s-1.346 3-3 3z'
															/>
														</svg>
														<span className='text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
															Dashboard
														</span>
													</div>
													{/* Icon */}
													<div className='flex shrink-0 ml-2'>
														<svg
															className={`w-3 h-3 shrink-0 ml-1 fill-current text-slate-400 ${
																open && "rotate-180"
															}`}
															viewBox='0 0 12 12'>
															<path d='M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z' />
														</svg>
													</div>
												</div>
											</a>
											<div className='lg:hidden lg:sidebar-expanded:block 2xl:block'>
												<ul className={`pl-9 mt-1 ${!open && "hidden"}`}>
													<li className='mb-1 last:mb-0'>
														<NavLink
															end
															to='/dashboard'
															className={({ isActive }) =>
																"block transition duration-150 truncate " +
																(isActive
																	? "text-yellow-500"
																	: "text-slate-400 hover:text-slate-200")
															}>
															<span className='text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
																Overview
															</span>
														</NavLink>
													</li>
													<li className='mb-1 last:mb-0'>
														<NavLink
															end
															to='/dashboard/sales'
															className={({ isActive }) =>
																"block transition duration-150 truncate " +
																(isActive
																	? "text-yellow-500"
																	: "text-slate-400 hover:text-slate-200")
															}>
															<span className='text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
																Daily Sales
															</span>
														</NavLink>
													</li>
													<li className='mb-1 last:mb-0'>
														<NavLink
															end
															to='/dashboard/expenses'
															className={({ isActive }) =>
																"block transition duration-150 truncate " +
																(isActive
																	? "text-yellow-500"
																	: "text-slate-400 hover:text-slate-200")
															}>
															<span className='text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
																Expenses
															</span>
														</NavLink>
													</li>
													{cred.role === "super" && (
														<li className='mb-1 last:mb-0'>
															<NavLink
																end
																to='/dashboard/branches'
																className={({ isActive }) =>
																	"block transition duration-150 truncate " +
																	(isActive
																		? "text-yellow-500"
																		: "text-slate-400 hover:text-slate-200")
																}>
																<span className='text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
																	Branches
																</span>
															</NavLink>
														</li>
													)}
													{cred.role === "admin" && (
														<li className='mb-1 last:mb-0'>
															<NavLink
																end
																to='/dashboard/direct-purchases'
																className={({ isActive }) =>
																	"block transition duration-150 truncate " +
																	(isActive
																		? "text-yellow-500"
																		: "text-slate-400 hover:text-slate-200")
																}>
																<span className='text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
																	Direct Purchases
																</span>
															</NavLink>
														</li>
													)}
													{cred.role === "super" && (
														<li className='mb-1 last:mb-0'>
															<NavLink
																end
																to='/dashboard/stocks-per-branch'
																className={({ isActive }) =>
																	"block transition duration-150 truncate " +
																	(isActive
																		? "text-yellow-500"
																		: "text-slate-400 hover:text-slate-200")
																}>
																<span className='text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
																	Stocks per branch
																</span>
															</NavLink>
														</li>
													)}
												</ul>
											</div>
										</React.Fragment>
									);
								}}
							</SidebarLinkGroup>

							{/* employees */}
							{cred.role === "super" && (
								<SidebarLinkGroup activecondition={pathname.includes("employees")}>
									{(handleClick, open) => {
										return (
											<React.Fragment>
												<a
													href='#0'
													className={`block text-slate-200 truncate transition duration-150 ${
														pathname.includes("employees")
															? "hover:text-slate-200"
															: "hover:text-white"
													}`}
													onClick={(e) => {
														e.preventDefault();
														sidebarExpanded ? handleClick() : setSidebarExpanded(true);
													}}>
													<div className='flex items-center justify-between'>
														<div className='flex items-center'>
															<svg
																className='shrink-0 h-6 w-6'
																viewBox='0 0 24 24'>
																<path
																	className={`fill-current ${
																		pathname.includes("employees")
																			? "text-yellow-500"
																			: "text-slate-600"
																	}`}
																	d='M18.974 8H22a2 2 0 012 2v6h-2v5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-5h-2v-6a2 2 0 012-2h.974zM20 7a2 2 0 11-.001-3.999A2 2 0 0120 7zM2.974 8H6a2 2 0 012 2v6H6v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5H0v-6a2 2 0 012-2h.974zM4 7a2 2 0 11-.001-3.999A2 2 0 014 7z'
																/>
																<path
																	className={`fill-current ${
																		pathname.includes("employees")
																			? "text-yellow-300"
																			: "text-slate-400"
																	}`}
																	d='M12 6a3 3 0 110-6 3 3 0 010 6zm2 18h-4a1 1 0 01-1-1v-6H6v-6a3 3 0 013-3h6a3 3 0 013 3v6h-3v6a1 1 0 01-1 1z'
																/>
															</svg>
															<span className='text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
																Employees
															</span>
														</div>
														{/* Icon */}
														<div className='flex shrink-0 ml-2'>
															<svg
																className={`w-3 h-3 shrink-0 ml-1 fill-current text-slate-400 ${
																	open && "rotate-180"
																}`}
																viewBox='0 0 12 12'>
																<path d='M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z' />
															</svg>
														</div>
													</div>
												</a>
												<div className='lg:hidden lg:sidebar-expanded:block 2xl:block'>
													<ul className={`pl-9 mt-1 ${!open && "hidden"}`}>
														<li className='mb-1 last:mb-0'>
															<NavLink
																end
																to='/employees'
																className={({ isActive }) =>
																	"block transition duration-150 truncate " +
																	(isActive
																		? "text-yellow-500"
																		: "text-slate-400 hover:text-slate-200")
																}>
																<span className='text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
																	Employees Record
																</span>
															</NavLink>
														</li>
														{/**
														* temporary remove cash advance 

															<li className='mb-1 last:mb-0'>
															<NavLink
																end
																to='/employees/cash-advance'
																className={({ isActive }) =>
																	"block transition duration-150 truncate " +
																	(isActive
																		? "text-yellow-500"
																		: "text-slate-400 hover:text-slate-200")
																}>
																<span className='text-sm font-medium lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
																	Cash Advance
																</span>
															</NavLink>
														</li>
													 */}
													</ul>
												</div>
											</React.Fragment>
										);
									}}
								</SidebarLinkGroup>
							)}

							{/* Customers */}
							{cred.role !== "super" && (
								<li
									className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${
										pathname.includes("customers") && "bg-slate-900"
									}`}>
									<NavLink
										end
										to='/customers'
										className={`block text-slate-200 truncate transition duration-150 ${
											pathname.includes("customers")
												? "hover:text-slate-200"
												: "hover:text-white"
										}`}>
										<div className='flex items-center'>
											<svg
												className='shrink-0 h-6 w-6'
												viewBox='0 0 24 24'>
												<path
													className={`fill-current ${
														pathname.includes("customers")
															? "text-yellow-500"
															: "text-slate-600"
													}`}
													d='M18.974 8H22a2 2 0 012 2v6h-2v5a1 1 0 01-1 1h-2a1 1 0 01-1-1v-5h-2v-6a2 2 0 012-2h.974zM20 7a2 2 0 11-.001-3.999A2 2 0 0120 7zM2.974 8H6a2 2 0 012 2v6H6v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5H0v-6a2 2 0 012-2h.974zM4 7a2 2 0 11-.001-3.999A2 2 0 014 7z'
												/>
												<path
													className={`fill-current ${
														pathname.includes("customers")
															? "text-yellow-300"
															: "text-slate-400"
													}`}
													d='M12 6a3 3 0 110-6 3 3 0 010 6zm2 18h-4a1 1 0 01-1-1v-6H6v-6a3 3 0 013-3h6a3 3 0 013 3v6h-3v6a1 1 0 01-1 1z'
												/>
											</svg>
											<span className='text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
												Customers
											</span>
										</div>
									</NavLink>
								</li>
							)}

							{/* Inventory */}
							{cred.role !== "super" && (
								<li
									className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${
										pathname.includes("inventory") && "bg-slate-900"
									}`}>
									<NavLink
										end
										to='/inventory'
										className={`block text-slate-200 truncate transition duration-150 ${
											pathname.includes("inventory")
												? "hover:text-slate-200"
												: "hover:text-white"
										}`}>
										<div className='flex items-center'>
											<svg
												className='shrink-0 h-6 w-6'
												viewBox='0 0 24 24'>
												<path
													className={`fill-current ${
														pathname.includes("inventory")
															? "text-yellow-500"
															: "text-slate-600"
													}`}
													d='M16 13v4H8v-4H0l3-9h18l3 9h-8Z'
												/>
												<path
													className={`fill-current ${
														pathname.includes("inventory")
															? "text-yellow-300"
															: "text-slate-400"
													}`}
													d='m23.72 12 .229.686A.984.984 0 0 1 24 13v8a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1v-8c0-.107.017-.213.051-.314L.28 12H8v4h8v-4H23.72ZM13 0v7h3l-4 5-4-5h3V0h2Z'
												/>
											</svg>
											<span className='text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
												Inventory
											</span>
										</div>
									</NavLink>
								</li>
							)}
							{/* Installments */}

							<li
								className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${
									pathname.includes("installments") && "bg-slate-900"
								}`}>
								<NavLink
									end
									to='/installments'
									className={`block text-slate-200 truncate transition duration-150 ${
										pathname.includes("installments")
											? "hover:text-slate-200"
											: "hover:text-white"
									}`}>
									<div className='flex items-center'>
										<svg
											className='shrink-0 h-6 w-6'
											viewBox='0 0 24 24'>
											<path
												className={`fill-current ${
													pathname.includes("installments")
														? "text-yellow-500"
														: "text-slate-600"
												}`}
												d='M1 3h22v20H1z'
											/>
											<path
												className={`fill-current ${
													pathname.includes("installments")
														? "text-yellow-300"
														: "text-slate-400"
												}`}
												d='M21 3h2v4H1V3h2V1h4v2h10V1h4v2Z'
											/>
										</svg>
										<span className='text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
											Installments
										</span>
									</div>
								</NavLink>
							</li>

							{/* Financing */}
							<li
								className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${
									pathname.includes("financing") && "bg-slate-900"
								}`}>
								<NavLink
									end
									to='/financing'
									className={`block text-slate-200 truncate transition duration-150 ${
										pathname.includes("financing")
											? "hover:text-slate-200"
											: "hover:text-white"
									}`}>
									<div className='flex items-center'>
										<svg
											className='shrink-0 h-6 w-6'
											viewBox='0 0 24 24'>
											<path
												className={`fill-current ${
													pathname.includes("financing")
														? "text-yellow-500"
														: "text-slate-600"
												}`}
												d='M12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 20c-4.963 0-9-4.037-9-9s4.037-9 9-9 9 4.037 9 9-4.037 9-9 9z'
											/>
											<path
												className={`fill-current ${
													pathname.includes("financing")
														? "text-yellow-300"
														: "text-slate-400"
												}`}
												d='M12 6.5c-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5 3.5-1.567 3.5-3.5-1.567-3.5-3.5-3.5zm0 5c-.828 0-1.5-.672-1.5-1.5S11.172 8.5 12 8.5s1.5.672 1.5 1.5-.672 1.5-1.5 1.5z'
											/>
											<path
												className={`fill-current ${
													pathname.includes("financing")
														? "text-yellow-300"
														: "text-slate-400"
												}`}
												d='M12 4.5c-4.136 0-7.5 3.364-7.5 7.5s3.364 7.5 7.5 7.5 7.5-3.364 7.5-7.5-3.364-7.5-7.5-7.5zm0 13c-3.033 0-5.5-2.467-5.5-5.5S8.967 6.5 12 6.5s5.5 2.467 5.5 5.5-2.467 5.5-5.5 5.5z'
											/>
										</svg>
										<span className='text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
											Financing
										</span>
									</div>
								</NavLink>
							</li>

							{/**Dues */}
							<li
								className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${
									pathname.includes("dues") && "bg-slate-900"
								}`}>
								<NavLink
									end
									to='/dues'
									className={`block text-slate-200 truncate transition duration-150 ${
										pathname.includes("dues")
											? "hover:text-slate-200"
											: "hover:text-white"
									}`}>
									<div className='flex items-center'>
										<svg
											className='shrink-0 h-6 w-6'
											viewBox='0 0 24 24'>
											<path
												className={`fill-current ${
													pathname.includes("dues") ? "text-yellow-500" : "text-slate-600"
												}`}
												d='M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-13h2v6h-2zm0 8h2v2h-2z'
											/>
										</svg>
										<span className='text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
											Dues
										</span>
									</div>
								</NavLink>
							</li>

							{/* Logs */}
							{cred.role === "super" && (
								<li
									className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${
										pathname.includes("logs") && "bg-slate-900"
									}`}>
									<NavLink
										end
										to='/logs'
										className={`block text-slate-200 truncate transition duration-150 ${
											pathname.includes("logs")
												? "hover:text-slate-200"
												: "hover:text-white"
										}`}>
										<div className='flex items-center'>
											<svg
												className='shrink-0 h-6 w-6'
												viewBox='0 0 24 24'>
												<path
													className={`fill-current ${
														pathname.includes("logs") ? "text-yellow-500" : "text-slate-600"
													}`}
													d='M20 7a.75.75 0 01-.75-.75 1.5 1.5 0 00-1.5-1.5.75.75 0 110-1.5 1.5 1.5 0 001.5-1.5.75.75 0 111.5 0 1.5 1.5 0 001.5 1.5.75.75 0 110 1.5 1.5 1.5 0 00-1.5 1.5A.75.75 0 0120 7zM4 23a.75.75 0 01-.75-.75 1.5 1.5 0 00-1.5-1.5.75.75 0 110-1.5 1.5 1.5 0 001.5-1.5.75.75 0 111.5 0 1.5 1.5 0 001.5 1.5.75.75 0 110 1.5 1.5 1.5 0 00-1.5 1.5A.75.75 0 014 23z'
												/>
												<path
													className={`fill-current ${
														pathname.includes("logs") ? "text-yellow-300" : "text-slate-400"
													}`}
													d='M17 23a1 1 0 01-1-1 4 4 0 00-4-4 1 1 0 010-2 4 4 0 004-4 1 1 0 012 0 4 4 0 004 4 1 1 0 010 2 4 4 0 00-4 4 1 1 0 01-1 1zM7 13a1 1 0 01-1-1 4 4 0 00-4-4 1 1 0 110-2 4 4 0 004-4 1 1 0 112 0 4 4 0 004 4 1 1 0 010 2 4 4 0 00-4 4 1 1 0 01-1 1z'
												/>
											</svg>
											<span className='text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
												History/Logs
											</span>
										</div>
									</NavLink>
								</li>
							)}
						</ul>
					</div>
				</div>

				{/* Expand / collapse button */}
				<div className='pt-3 hidden lg:inline-flex 2xl:hidden justify-end mt-auto'>
					<div className='px-3 py-2'>
						<button onClick={() => setSidebarExpanded(!sidebarExpanded)}>
							<span className='sr-only'>Expand / collapse sidebar</span>
							<svg
								className='w-6 h-6 fill-current sidebar-expanded:rotate-180'
								viewBox='0 0 24 24'>
								<path
									className='text-slate-400'
									d='M19.586 11l-5-5L16 4.586 23.414 12 16 19.414 14.586 18l5-5H7v-2z'
								/>
								<path
									className='text-slate-600'
									d='M3 23H1V1h2z'
								/>
							</svg>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Sidebar;
