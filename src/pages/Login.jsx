import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCredStore } from "../store/data";

import logo from "../assets/jgs_logo.png";
import bg from "../assets/bg.jpg";
import { Toaster, toast } from "sonner";
import supabase from "../lib/supabase";

function Login() {
	const emailInputRef = useRef();
	const passwordInputRef = useRef();

	const handleLogin = async (e) => {
		e.preventDefault();
		const email = emailInputRef.current.value;
		const password = passwordInputRef.current.value;

		if (!email || !password) {
			toast.error("Please input all fields!");
			return;
		}

		const { data, error } = await supabase.auth.signIn({
			email,
			password,
		});

		if (error) {
			toast.error("Invalid credentials. Please try again.");
			return;
		}

		const { data: userData, error: userError } = await supabase
			.from("users")
			.select(
				"first_name, last_name, phone_number, role, branch_id, is_deactivated"
			)
			.eq("user_id", data?.user?.id);

		if (userError) {
			console.error("User data retrieval error:", userError);
			toast.error("Error retrieving user record. Please try again in a while.");
			return;
		}

		if (userData[0].is_deactivated) {
			toast.error(
				"Your account has been deactivated. Please contact the administrator."
			);
			return;
		}

		const { data: branchData, error: branchError } = await supabase
			.from("branches")
			.select("branch_name")
			.eq("id", userData[0].branch_id);

		if (branchError) {
			toast.error("Cannot retrieve branch name. Please try logging in again.");
			return;
		}

		localStorage.setItem("token", data.access_token);
		localStorage.setItem(
			"admin",
			JSON.stringify({
				branch_id: userData[0].branch_id,
				email,
				id: data?.user?.id,
				name: userData[0]?.first_name + " " + userData[0]?.last_name,
				role: userData[0]?.role,
				branch_name: branchData[0].branch_name,
			})
		);

		window.location.href = "/dashboard";
	};

	useEffect(() => {
		document.title = "Login | JGs Appliances Trading | POS";
	}, []);
	return (
		<div className='font-main'>
			<Toaster
				position='bottom-right'
				richColors
			/>
			<div className='xs:flex'>
				<form
					onSubmit={(e) => handleLogin(e)}
					className='xs:mt-32 md:mt-36 lg:mt-44 px-8 xs:w-full md:w-11/12 lg:w-6/12'>
					<Link to='/'>
						<img
							src={logo}
							alt='JGS POS'
							className='my-4 xs:w-20 h-20'
						/>
					</Link>
					<h1 className='text-primary font-semibold xs:text-sm'>
						JGs Appliances Trading | POS
					</h1>
					<h1 className='font-bold xs:text-3xl'>Welcome admin!</h1>
					<p>Start managing your inventory.</p>
					<div className='flex flex-col mt-4'>
						<label htmlFor='email'>Email</label>
						<input
							type='email'
							required
							ref={emailInputRef}
							className={`border border-gray-300 rounded-md p-2 mt-4 w-full`}
						/>
					</div>
					<div className='flex flex-col mt-4'>
						<label htmlFor='password'>Password</label>
						<input
							type='password'
							required
							className={`border border-gray-300 rounded-md p-2 mt-4 w-full `}
							ref={passwordInputRef}
						/>
					</div>
					<button
						onClick={handleLogin}
						className='w-full bg-yellow-300 py-2 text-center text-black font-semibold rounded-md mt-4'>
						Log in
					</button>
				</form>
				<img
					src={bg}
					alt='JGS Pos BG'
					draggable={false}
					className='hidden md:block h-screen w-full	object-cover'
				/>
			</div>
		</div>
	);
}

export default Login;
