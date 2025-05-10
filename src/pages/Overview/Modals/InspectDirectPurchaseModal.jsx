import React from "react";
import { Toaster } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useCredStore } from "../../../store/data";
import logo from "../../../assets/jgs_logo.png";

const InspectDirectPurchaseModal = ({ details, handleCloseModal }) => {
	const { cred } = useCredStore();

	const handlePrintReceipt = () => {
		window.print();
	};

	console.log(details);

	const handleDownloadPDF = () => {
		const doc = new jsPDF();
		doc.addImage(logo, "PNG", 14, 10, 30, 30);
		doc.text("JGs Applianceshop Trading", 14, 50);
		doc.text(`Branch: ${cred.branch_name}`, 14, 60);
		doc.text(`Customer Name: ${details.customer_name}`, 14, 70);
		doc.text(`Payment Method: ${details.payment_method}`, 14, 80);
		doc.text(
			`Date Purchased: ${new Date(details.created_at).toLocaleDateString("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})}`,
			14,
			90
		);
		if (details.payment_method === "Gcash") {
			doc.text(`Reference Number: ${details.reference_number}`, 14, 100);
		}

		const tableColumn = ["Product ID", "Product Name", "Price", "Quantity"];
		const tableRows = [];

		details.direct_purchase_items.forEach((product) => {
			const productData = [
				product.item_id,
				product.product_name,
				product.price,
				product.quantity,
			];
			tableRows.push(productData);
		});

		doc.autoTable(tableColumn, tableRows, { startY: 110 });
		doc.text(
			`Total Amount: ${details.amount}`,
			14,
			doc.autoTable.previous.finalY + 10
		);
		doc.save("receipt.pdf");
	};

	return (
		<div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50'>
			<Toaster
				richColors
				position='top-center'
			/>
			<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-[600px] h-[850px] overflow-y-auto'>
				<h2 className='text-2xl text-black font-semibold dark:text-white mb-4 text-center'>
					Purchase Details
				</h2>
				<hr className='mb-4' />
				<div className='mb-4'>
					<div className='flex justify-center mb-4'>
						<img
							src={logo}
							alt='JGs Applianceshop Trading'
							className='h-16'
						/>
					</div>
					<h3 className='text-xl font-bold text-center'>
						JGs Applianceshop Trading
					</h3>
					<p className='text-center'>Branch: {cred.branch_name}</p>
				</div>
				<div className='mb-4'>
					<p>Customer Name: {details.customer_name}</p>
					<p>Collector Name: {details.collector_name}</p>
					<p>Payment Method: {details.payment_method}</p>
					{details.payment_method === "Gcash" && (
						<p>Reference Number: {details.reference_number}</p>
					)}
					<p>
						Date Purchased:
						{new Date(details.created_at).toLocaleDateString("en-US", {
							year: "numeric",
							month: "long",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})}
					</p>
				</div>
				<div className='mb-4'>
					<table className='min-w-full bg-white dark:bg-gray-700'>
						<thead>
							<tr>
								<th className='py-2 px-4 border-b'>Product ID</th>
								<th className='py-2 px-4 border-b'>Product Name</th>
								<th className='py-2 px-4 border-b'>Product Price</th>
								<th className='py-2 px-4 border-b'>Quantity</th>
							</tr>
						</thead>
						<tbody>
							{details.direct_purchase_items.map((product, index) => (
								<tr key={index}>
									<td className='py-2 px-4 border-b'>{product.item_id}</td>
									<td className='py-2 px-4 border-b'>{product.product_name}</td>
									<td className='py-2 px-4 border-b'>{product.price}</td>
									<td className='py-2 px-4 border-b'>{product.quantity}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className='mb-4'>
					<p className='text-lg font-bold'>Total Amount: {details.amount}</p>
				</div>
				<div className='flex justify-end sticky bottom-0 bg-white dark:bg-gray-700 p-4'>
					<button
						onClick={handleCloseModal}
						className='px-4 py-2 text-white bg-gray-400 rounded'>
						Close
					</button>
					<button
						onClick={handlePrintReceipt}
						className='ml-2 px-4 py-2 bg-blue-500 text-white rounded'>
						Print Receipt
					</button>
					<button
						onClick={handleDownloadPDF}
						className='ml-2 px-4 py-2 bg-red-500 text-white rounded'>
						Download PDF
					</button>
				</div>
			</div>
		</div>
	);
};

export default InspectDirectPurchaseModal;
