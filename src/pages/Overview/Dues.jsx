import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../partials/Sidebar";
import Header from "../../partials/Header";
import { useInstallmentStore } from "../../store/data";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useCredStore } from "../../store/data";
import { fetchInstallmentsAndNotify } from "../../utils/notifier";
import supabase from "../../lib/supabase";

//update apr 1
const Dues = () => {
	const location = useLocation();
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { cred } = useCredStore();
	const [installments, setInstallments] = useState([]);
	const today = new Date();

	// filter installments for dues
	const getDuesInstallments = () => {
		const dues = {
			purple: [],
			yellow: [],
		};

		// Ensure installments is an array before iterating
if (Array.isArray(installments)) {
    installments.forEach((installment) => {
        const dueDate = new Date(installment.latest_payment_date);
        const today = new Date();

        // Extract the day from both dates to compare only the day of the month
        const installmentDay = dueDate.getDate();
        const currentDay = today.getDate();

        // Calculate the difference in days (ignoring time component)
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

        const { status, payments } = installment;

        // ✅ Check if the installment has been paid for this month
        const isPaidThisMonth = payments?.some((payment) => {
            const paymentDate = new Date(payment.date);
            return (
                paymentDate.getMonth() === today.getMonth() &&
                paymentDate.getFullYear() === today.getFullYear()
            );
        });

        // Check if the installment is due today (same day regardless of month)
        if (installmentDay === currentDay && status === "On-going") {
            dues.purple.push(installment); // due today
        } else if (diffDays <= -7 && status === "On-going") {
            dues.yellow.push(installment); // overdue within 7 days
        }
    });
} else {
    console.warn("Installments is not an array:", installments);
}

return dues;


		// Ensure installments is an array before iterating
		// if (Array.isArray(installments)) {
		//	installments.forEach((installment) => {
		//		const dueDate = new Date(installment.latest_payment_date);
		//		// Set both dates to midnight to ignore time component
		//		dueDate.setHours(0, 0, 0, 0);
		//		today.setHours(0, 0, 0, 0);
		//		const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

		//		const { status, payments } = installment;


				 // ✅ Check if the installment has been paid for this month
		//		 const isPaidThisMonth = payments?.some((payment) => {
		//			const paymentDate = new Date(payment.date);
		//			return (
		//				paymentDate.getMonth() === today.getMonth() &&
		//				paymentDate.getFullYear() === today.getFullYear()
		//			);
		//		});
	

		//		if (diffDays === 0 && status === "On-go ing") {
		//			dues.purple.push(installment); // due today
		//		} else if (diffDays <= -7 && status === "On-going") {
		//			dues.yellow.push(installment); // overdue within 7 days
		//		}
		//	});
		//} else {
		//	console.warn("Installments is not an array:", installments);
		//}

		//return dues;
	};

	const duesInstallments = getDuesInstallments();

	const exportToPDF = () => {
		const doc = new jsPDF({
			orientation: "landscape",
			unit: "mm",
			format: "legal",
			margin: 0.2,
		});
		const tableColumn = [
			"Due",
			"Term",
			"Name",
			"Address",
			"Occupation",
			"BIR TIN (Optional)",
			"Date Released",
			"Phone",
			"Unit",
			"IMEI",
			"Total Payment",
			"Down Payment",
			"Purple",
			"Yellow",
			"White",
			"Trademark",
			cred.role === "super" && "Branch",
		];
		const tableRowsDueToday = [];
		const tableRowsLapse = [];

		const combinedDues = [...duesInstallments.purple, ...duesInstallments.yellow];

		combinedDues.forEach((installment) => {
			const rowData = [
				new Date(installment.latest_payment_date).toLocaleDateString("en-US", {
					month: "long",
					day: "2-digit",
					year: "numeric",
				}),
				installment.term + "M",
				installment.customer_name,
				installment.customer_full_address,
				installment.customer_occupation,
				installment.customer_bir_tin,
				new Date(installment.date_released).toLocaleDateString("en-US", {
					month: "long",
					day: "2-digit",
					year: "numeric",
				}),
				installment.phone_number,
				installment.items?.item_name,
				installment.items?.item_imei,
				installment.total,
				installment.partial_amount_paid,
				installment.purple,
				installment.yellow,
				installment.white,
				installment.trademark,
				cred.role === "super" && installment.branches?.branch_name,
			];

			const dueDate = new Date(installment.latest_payment_date);
			const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));

			const { status } = installment;

			// Ensure correct categorization
			if (diffDays === 0 && status === "On-going") {
				tableRowsDueToday.push(rowData); // Due today
			} else if (diffDays <= -7 && status === "On-going") {
				tableRowsLapse.push(rowData); // Lapse within 7 days
			}
		});

		// Add Due Today section
		doc.text("Due Today Installments", 14, 15);
		doc.autoTable(tableColumn, tableRowsDueToday, { startY: 20 });

		// Add Lapse within 7 Days section
		doc.addPage(); // Add a new page for the next section
		doc.text("Lapse within 7 Days Installments", 14, 15);
		doc.autoTable(tableColumn, tableRowsLapse, { startY: 20 });

		doc.save("Dues_Installments.pdf");
	};

	const renderTable = (data, color) => (
		<div className={`border-l-4 p-4 mb-6 overflow-x-auto`}>
			<h2 className={`text-${color}-500 font-bold mb-2`}>
				{color.charAt(0).toUpperCase() + color.slice(1)}
			</h2>
			<p>
				{color === "purple" ? "Due Date Now" : "Lapse within 7 days/For deposit"}
			</p>
			<table className='w-full text-sm text-gray-500'>
				<thead className={`bg-${color}-500 text-white`}>
					<tr>
						{[
							"Due",
							"Term",
							"Name",
							"Address",
							"Occupation",
							"BIR TIN (Optional)",
							"Date Released",
							"Phone #",
							"Unit",
							"IMEI",
							"Total Payment",
							"Down Payment",
							"Purple",
							"Yellow",
							"White",
							"Trademark",
							cred.role === "super" && "Branch Name",
						].map((heading, idx) => (
							<th
								key={idx}
								className='px-6 py-3'>
								{heading}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{data.length > 0 ? (
						data.map((row, index) => (
							<tr className='odd:bg-white even:bg-gray-50 border-b hover:bg-indigo-50'>
								<th className='px-6 py-4 font-medium'>
									{new Date(row?.latest_payment_date).toLocaleDateString("en-US", {
										month: "long",
										day: "2-digit",
										year: "numeric",
									})}
								</th>
								<td className='px-6 py-4'>{row.term + "M"}</td>
								<td className='px-6 py-4'>{row.customer_name}</td>
								<td className='px-6 py-4'>{row.customer_full_address}</td>
								<td className='px-6 py-4'>{row.customer_occupation}</td>
								<td className='px-6 py-4'>{row.customer_bir_tin}</td>
								<td className='px-6 py-4'>
									{new Date(row?.date_released).toLocaleDateString("en-US", {
										month: "long",
										day: "2-digit",
										year: "numeric",
									})}
								</td>
								<td className='px-6 py-4'>{row?.phone}</td>
								<td className='px-6 py-4'>{row?.items?.item_name}</td>
								<td className='px-6 py-4'>{row?.items?.item_imei}</td>
								<td className='px-6 py-4'>{row?.total}</td>
								<td className='px-6 py-4'>{row?.partial_amount_paid}</td>
								<td className='px-6 py-4'>{row?.purple}</td>
								<td className='px-6 py-4'>{row?.yellow}</td>
								<td className='px-6 py-4'>{row?.white}</td>
								<td className='px-6 py-4'>{row?.trademark}</td>
								<td className='px-6 py-4'>
									{cred.role === "super" && row?.branches.branch_name}
								</td>
							</tr>
						))
					) : (
						<tr>
							<td
								colSpan='7'
								className='text-center py-4'>
								No records.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);

	const handleGetAllInstallmentsInSpecificBranch = async () => {
		try {
			const { data, error } = await supabase
				.from("installments")
				.select(
					`
							*, items (id, item_name, item_imei, serial, item_price), 
					branches (id, branch_name),
					months_to_pay (*)
				`
				)
				.eq("branch_id", cred.branch_id);
			if (error) {
				console.error("Supabase error (Super):", error);
				toast.error("Failed to retrieve installments.");
				return;
			}

			setInstallments(data);
		} catch (err) {}
	};

	const handleGetAllInstallments = async () => {
		try {
			const { data, error } = await supabase.from("installments").select(
				`
							*, items (id, item_name, item_imei, serial, item_price), 
					branches (id, branch_name),
					months_to_pay (*)
				`
			);
			if (error) {
				console.error("Supabase error (Super):", error);
				toast.error("Failed to retrieve installments.");
				return;
			}

			setInstallments(data);
		} catch (err) {}
	};

	useEffect(() => {
		if (cred.role === "super") {
			handleGetAllInstallments();
		} else {
			handleGetAllInstallmentsInSpecificBranch();
		}
	}, []);

	useEffect(() => {
		if (cred.role === "admin") fetchInstallmentsAndNotify(cred.branch_id);
	}, []);

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
					<div className='px-4 sm:px-6 lg:px-8 py-8 max-w-9xl mx-auto'>
						<h1 className='text-2xl font-bold mb-5'>Dues Installments</h1>
						<button
							onClick={exportToPDF}
							className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mb-4'>
							Download Dues in PDF
						</button>
						{/* Purple and Yellow Tables */}
						{renderTable(duesInstallments.purple, "purple")}
						{renderTable(duesInstallments.yellow, "yellow")}
					</div>
				</main>
			</div>
		</div>
	);
};

export default Dues;
