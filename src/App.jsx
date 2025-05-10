import React, { useEffect } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	useLocation,
} from "react-router-dom";

import "./css/style.css";
import "./charts/ChartjsConfig";
import ThemeProvider from "./utils/ThemeContext";

// Import pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Wrapper from "./pages/Wrapper";
import DailySales from "./pages/Overview/DailySales";
import Inventory from "./pages/Overview/Inventory";
import DirectPurchases from "./pages/Overview/DirectPurchases";
import { Expenses } from "./pages/Overview/Expenses";
import Installments from "./pages/Overview/Installments";
import Branches from "./pages/Overview/Branches";
import Logs from "./pages/Overview/Logs";
import { Employees } from "./pages/Overview/Employees";
import StocksPerBranch from "./pages/Overview/StocksPerBranch";
import Customers from "./pages/Overview/Customers";
import CashAdvance from "./pages/Overview/CashAdvance";
import AddDirectPurchasePage from "./pages/Overview/AddDirectPurchasePage";
import Financing from "./pages/Overview/Financing";
import Dues from "./pages/Overview/Dues";

// Scroll to top on route change
function ScrollToTop() {
	const { pathname } = useLocation();

	useEffect(() => {
		document.querySelector("html").style.scrollBehavior = "auto";
		window.scroll({ top: 0 });
		document.querySelector("html").style.scrollBehavior = "";
	}, [pathname]);

	return null;
}

function App() {
	return (
		<ThemeProvider>
			<Router>
				<ScrollToTop />
				<Routes>
					<Route
						path='/'
						element={<Login />}
					/>
					<Route element={<Wrapper />}>
						<Route
							path='/dashboard'
							element={<Dashboard />}
						/>
						<Route
							path='/dashboard/sales'
							element={<DailySales />}
						/>
						<Route
							path='/dashboard/direct-purchases'
							element={<DirectPurchases />}
						/>
						<Route
							path='/dashboard/add-direct-purchases'
							element={<AddDirectPurchasePage />}
						/>
						<Route
							path='/inventory'
							element={<Inventory />}
						/>
						<Route
							path='/dashboard/expenses'
							element={<Expenses />}
						/>
						<Route
							path='/installments'
							element={<Installments />}
						/>
						<Route
							path='/dashboard/branches'
							element={<Branches />}
						/>
						<Route
							path='/dashboard/stocks-per-branch'
							element={<StocksPerBranch />}
						/>
						<Route
							path='/logs'
							element={<Logs />}
						/>
						<Route
							path='/employees'
							element={<Employees />}
						/>
						<Route
							path='/financing'
							element={<Financing />}
						/>
						<Route
							path='/dues'
							element={<Dues />}
						/>
						<Route
							path='/customers'
							element={<Customers />}
						/>
						<Route
							path='/employees/cash-advance'
							element={<CashAdvance />}
						/>
					</Route>
				</Routes>
			</Router>
		</ThemeProvider>
	);
}

export default App;
