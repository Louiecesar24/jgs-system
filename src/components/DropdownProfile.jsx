import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Transition from "../utils/Transition";
import { useCredStore } from "../store/data";
import supabase from "../lib/supabase";
import UserAvatar from "../images/user-avatar-32.png";
import { toast, Toaster } from "sonner";

function DropdownProfile({ align }) {
	const { cred } = useCredStore();
	const [dropdownOpen, setDropdownOpen] = useState(false);

	const trigger = useRef(null);
	const dropdown = useRef(null);

	const handleSignOut = async () => {
		try {
			const { error } = await supabase.auth.signOut();

			if (error) {
				toast.error("Error logging out, please try again.");
				return;
			}

			localStorage.clear();
			window.location.replace("/");
		} catch (err) {
			console.error("Error during sign out:", err);
			alert("Error signing out. Please try again.");
		}
	};

	useEffect(() => {
		const clickHandler = ({ target }) => {
			if (!dropdown.current) return;
			if (
				!dropdownOpen ||
				dropdown.current.contains(target) ||
				trigger.current.contains(target)
			)
				return;
			setDropdownOpen(false);
		};
		document.addEventListener("click", clickHandler);
		return () => document.removeEventListener("click", clickHandler);
	});

	// close if the esc key is pressed
	useEffect(() => {
		const keyHandler = ({ keyCode }) => {
			if (!dropdownOpen || keyCode !== 27) return;
			setDropdownOpen(false);
		};
		document.addEventListener("keydown", keyHandler);
		return () => document.removeEventListener("keydown", keyHandler);
	});

	return (
		<div className='relative inline-flex'>
			<Toaster
				richColors
				position='top-center'
			/>
			<button
				ref={trigger}
				className='inline-flex justify-center items-center group'
				aria-haspopup='true'
				onClick={() => setDropdownOpen(!dropdownOpen)}
				aria-expanded={dropdownOpen}>
				<img
					className='w-8 h-8 rounded-full'
					src={UserAvatar}
					width='32'
					height='32'
					alt='User'
				/>
				<div className='flex items-center truncate'>
					<span className='truncate ml-2 text-sm font-medium dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-200'>
						{cred.name}
					</span>
					<svg
						className='w-3 h-3 shrink-0 ml-1 fill-current text-slate-400'
						viewBox='0 0 12 12'>
						<path d='M5.9 11.4L.5 6l1.4-1.4 4 4 4-4L11.3 6z' />
					</svg>
				</div>
			</button>

			<Transition
				className={`origin-top-right z-10 absolute top-full min-w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1.5 rounded shadow-lg overflow-hidden mt-1 ${
					align === "right" ? "right-0" : "left-0"
				}`}
				show={dropdownOpen}
				enter='transition ease-out duration-200 transform'
				enterStart='opacity-0 -translate-y-2'
				enterEnd='opacity-100 translate-y-0'
				leave='transition ease-out duration-200'
				leaveStart='opacity-100'
				leaveEnd='opacity-0'>
				<div
					ref={dropdown}
					onFocus={() => setDropdownOpen(true)}
					onBlur={() => setDropdownOpen(false)}>
					<div className='pt-0.5 pb-2 px-3 mb-1 border-b border-slate-200 dark:border-slate-700'>
						<div className='font-medium text-slate-800 dark:text-slate-100'>
							{cred.name}
						</div>
						<div className='text-xs text-slate-500 dark:text-slate-400 italic'>
							{cred.role === "super" && "Super"} Administrator
						</div>
					</div>
					<ul>
						<li>
							<button
								className='font-medium text-sm text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center py-1 px-3'
								onClick={handleSignOut}>
								Sign Out
							</button>
						</li>
					</ul>
				</div>
			</Transition>
		</div>
	);
}

export default DropdownProfile;
