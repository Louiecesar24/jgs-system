import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useCredStore } from "../store/data";

const Wrapper = () => {
	const [isAuthenticated, setIsAuthenticated] = useState(null);
	const { setCreds } = useCredStore();

	setCreds();

	useEffect(() => {
		const checkAuthentication = () => {
			try {
				const token = localStorage.getItem("token");
				const admin = localStorage.getItem("admin");

				if (token && admin) {
					setIsAuthenticated(true);
				} else {
					setIsAuthenticated(false);
				}
			} catch (error) {
				console.error("Error accessing local storage:", error);
				setIsAuthenticated(false);
			}
		};

		checkAuthentication();
	}, []);

	if (isAuthenticated === null) {
		return null;
	}

	return isAuthenticated ? <Outlet /> : <Navigate to='/' />;
};

export default Wrapper;
