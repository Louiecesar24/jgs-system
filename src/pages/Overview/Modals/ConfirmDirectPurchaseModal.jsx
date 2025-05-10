import React from "react";
import { useNavigate } from "react-router-dom";
import { Toaster, toast } from "sonner";
import supabase from "../../../lib/supabase";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useCredStore } from "../../../store/data";
import logo from "../../../assets/jgs_logo.png";

const ConfirmDirectPurchaseModal = ({
	details,
	selectedProducts,
	handleCloseSaveModal,
}) => {
	const { cred } = useCredStore();
	const Navigate = useNavigate();

	console.log(details)

	const handleSaveDirectPurchase = async () => {
		try {
			// Step 1: Fetch stock data for all selected products before any insertion
			const productIds = selectedProducts.map((product) => product.item_id);
			const { data: items, error: stockError } = await supabase
				.from("items")
				.select("id, stocks, number_of_sold")
				.in("id", productIds);

			if (stockError) {
				toast.error("Error fetching stock data. Please try again.");
				return;
			}

			// Step 2: Check if there are sufficient stocks for each product
			for (const product of selectedProducts) {
				const item = items.find((item) => item.id === product.item_id);

				if (!item) {
					toast.error(`Product not found in inventory: ${product.item_name}`);
					return;
				}

				if (item.stocks < product.quantity) {
					toast.warning(
						`Insufficient stocks for ${product.item_name}. Available stocks: ${item.stocks}.`
					);
					return;
				}
			}

			// Step 3: Calculate total amount for the direct purchase
			const totalAmount = selectedProducts.reduce(
				(acc, product) => acc + product.item_price * product.quantity,
				0
			);

			// Step 4: Insert the direct purchase entry
			const { data: direct, error } = await supabase
				.from("direct_purchases")
				.insert({
					customer_name: details.customer_name,
					amount: totalAmount,
					reference_number: details.reference_number,
					payment_method: details.payment_method,
					collector_name: details.collector_name,
					branch_id: cred.branch_id,
				})
				.select();

			if (error) {
				toast.error("Error adding new direct purchase. Please try again.");
				return;
			}

			// Step 5: Process each product in the direct purchase
			for (const product of selectedProducts) {
				console.log(product)
				const item = items.find((item) => item.id === product.item_id);
				const remainingStocks = item.stocks - product.quantity;
				const numberOfSoldsAdd =
					Number(item.number_of_sold) + Number(product.quantity);

				console.log("Remaining stocks:", remainingStocks);

				// Step 6: Update item stock and number of sold
				const { error: updateError } = await supabase
					.from("items")
					.update({
						stocks: remainingStocks,
						number_of_sold: numberOfSoldsAdd,
					})
					.eq("id", product.item_id);

				if (updateError) {
					toast.error(`Error updating stocks for ${product.item_name}.`);
					return;
				}

				console.log(typeof(product.item_price), parseFloat(product.item_price).toFixed(2))

				const { error: directPurchaseItemsError } = await supabase
					.from("direct_purchase_items")
					.insert({
						product_name: product.item_name,
						price: typeof product.item_price === "number" ? product.item_price : parseFloat(product.item_price) || 0,
						quantity: typeof product.quantity === "number" ? product.quantity : parseInt(product.quantity, 10) || 0,
						direct_purchase_id: direct[0].id,
						item_id: product.item_id
					});

				if (directPurchaseItemsError) {
					console.error(directPurchaseItemsError);
					throw new Error("Error adding purchase items. Please try again.");
				}
					

				// Step 7: Insert sale record
				const { error: salesError } = await supabase.from("sales").insert({
					amount: product.item_price * product.quantity,
					date_issued: new Date(),
					payment_method: details.payment_method,
					purchase_id: direct[0].id,
					branch_id: cred.branch_id,
				});

				if (salesError) {
					toast.error(`Error recording sale for ${product.item_name}.`);
					return;
				}

				// Step 8: Log the transaction
				const { error: logError } = await supabase.from("logs").insert({
					log_label: `${cred.name} processed a direct purchase of ${product.item_name}`,
					log_category: "Direct Purchase",
					purchase_id: direct[0].id,
					user_id: cred.user_id,
				});

				if (logError) {
					toast.error(`Error logging the transaction for ${product.item_name}.`);
					return;
				}

				// Step 9: Update employee transaction count
				const { data: empData, error: empError } = await supabase
					.from("employees")
					.select("number_of_transactions")
					.eq("user_id", cred.id);

				if (empError) return;

				const updatedTransactionCount = empData[0].number_of_transactions + 1;
				const { error: empUpdateError } = await supabase
					.from("employees")
					.update({
						number_of_transactions: updatedTransactionCount,
					})
					.eq("user_id", cred.id);

				if (empUpdateError) return;
			}

			// Notify success and close the modal
			toast.success("Direct purchase successfully completed. Thank you!");
			handleCloseSaveModal();
			Navigate("/dashboard/direct-purchases");
		} catch (error) {
			console.error("Error saving direct purchase:", error);
			alert("An error occurred while saving the purchase. Please try again.");
		}
	};

	const handlePrintReceipt = () => {
		window.print();
	};

	const handleDownloadPDF = () => {
		const doc = new jsPDF();
		doc.addImage(logo, "PNG", 14, 10, 30, 30);
		doc.text("JGs Applianceshop Trading", 14, 50);
		doc.text(`Branch: ${cred.branch_name}`, 14, 60);
		doc.text(`Customer Name: ${details.customer_name}`, 14, 70);
		doc.text(`Collector Name: ${details.collector_name}`, 14, 80);
		doc.text(`Payment Method: ${details.payment_method}`, 14, 90);
		if (details.payment_method === "Gcash") {
			doc.text(`Reference Number: ${details.reference_number}`, 14, 100);
		}

		const tableColumn = ["Product ID", "Product Name", "Price", "Quantity"];
		const tableRows = [];

		selectedProducts.forEach((product) => {
			const productData = [
				product.item_id,
				product.item_name,
				product.item_price,
				product.quantity,
			];
			tableRows.push(productData);
		});

		doc.autoTable(tableColumn, tableRows, { startY: 110 });
		doc.text(
			`Total Amount: ${selectedProducts.reduce(
				(acc, product) => acc + product.item_price * product.quantity,
				0
			)}`,
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
			<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-[800px] h-[700px] overflow-y-auto'>
				<h2 className='text-2xl text-black font-semibold dark:text-white mb-4 text-center'>
					Purchase Confirmation
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
							{selectedProducts.map((product, index) => (
								<tr key={index}>
									<td className='py-2 px-4 border-b'>{product.item_id}</td>
									<td className='py-2 px-4 border-b'>{product.item_name}</td>
									<td className='py-2 px-4 border-b'>{product.item_price}</td>
									<td className='py-2 px-4 border-b'>{product.quantity}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<div className='mb-4'>
					<p className='text-lg font-bold'>
						Total Amount:{" "}
						{selectedProducts.reduce(
							(acc, product) => acc + product.item_price * product.quantity,
							0
						)}
					</p>
				</div>
				<div className='flex justify-end sticky bottom-0 bg-white dark:bg-gray-700 p-4'>
					<button
						onClick={handleCloseSaveModal}
						className='px-4 py-2 text-white bg-gray-400 rounded'>
						Cancel
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
					<button
						onClick={handleSaveDirectPurchase}
						className='ml-2 px-7 py-2 bg-green-500 text-white rounded'>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmDirectPurchaseModal;
