import React, { useState, useEffect } from "react";
import { useCredStore } from "../../../store/data";
import supabase from "../../../lib/supabase";
import { toast, Toaster } from "sonner";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";

export const InstallmentStatus = ({
	installment = {},
	fetchInstallments,
	closeStatusModal,
}) => {

	const [isEditing, setIsEditing] = useState(null);
	const [editingData, setEditingData] = useState({
	selected_month: "",
	payment: "",
	payment_date: "",
	date_paid: "",
	});

	const { cred } = useCredStore();
	const [isEditMonthly, setIsEditMonthly] = useState(false);
	const [paymentVal, setPaymentVal] = useState(null);
	const [paymentData, setPaymentData] = useState({
		selected_month: "January",
		amount: 0,
		//newly added keys by Jeffrey
		payment_date: null,
		date_paid: null,
	});
	const [monthsPaid, setMonthsPaid] = useState([]);

	const total = installment?.months_to_pay.reduce((acc, curr) => {
		return acc + curr.payment;
	}, 0);

	const [yellow, setYellow] = useState(installment?.yellow || 0);
	const [purple, setPurple] = useState(installment?.purple || 0);
	const [comment, setComment] = useState(installment?.comment || "");
	const [isFullyPaid, setIsFullyPaid] = useState(false);
	const [white, setWhite] = useState(0); 

	const { width, height } = useWindowSize();

	//updates from sir jeff
	const handleEditClick = (payment) => {
		setIsEditing(payment.id);
		setEditingData({
		  selected_month: payment.selected_month,
		  payment: payment.payment,
		  payment_date: payment.payment_date,
		  date_paid: payment.date_paid,
		});
	  };
	  
	  //updates from sir jeff
	  const updatePayment = async (id) => {
		try {
		  const { error } = await supabase
			.from("months_to_pay")
			.update({
			  selected_month: editingData.selected_month,
			  payment: editingData.payment,
			  payment_date: editingData.payment_date,
			  date_paid: editingData.date_paid,
			})
			.eq("id", id);
	  
		  if (error) {
			toast.error("Error updating payment. Please try again.");
			return;
		  }
	  
		  toast.success("Payment updated successfully.");
		  fetchMonthsPaid();
		  setIsEditing(null);
		} catch (err) {
		  toast.error("An error occurred. Please try again.");
		}
	  };
	  

	const handleDepositRemateOrFullyPaidInstallment = async (
		installment_id,
		type
	) => {
		const statusMap = {
			full: "Fully-paid",
			deposit: "Deposit",
			remate: "Remate",
		};

		const status = statusMap[type];
		if (!status) return;

		try {
			const { error } = await supabase
				.from("installments")
				.update({ status })
				.eq("id", installment_id);

			if (error) throw error;

			const successMessages = {
				deposit: "Installment deposited successfully",
				full: "Installment is now fully-paid! Congratulations.",
				remate: "Installment remated successfully",
			};

			toast.success(successMessages[type]);
			closeStatusModal();
			fetchInstallments();
		} catch (error) {
			toast.error("Error updating installment. Please try again");
		}
	};

	const addNewPayment = async () => {
		try {
			// Validate payment data before proceeding
			if (
				!paymentData.payment ||
				!paymentData.selected_month ||
				!paymentData.payment_date ||
				!paymentData.date_paid
			) {
				toast.error("Please fill in all payment fields.");
				return;
			}

			const { data, error } = await supabase.from("months_to_pay").insert({
				installment_id: installment?.id,
				selected_month: paymentData.selected_month,
				payment: paymentData.payment,
				payment_date: paymentData.payment_date,
				date_paid: paymentData.date_paid,
			});

			const installmentDueDate = new Date(paymentData.payment_date);
			let nextMonth = installmentDueDate.getMonth();
			let nextYear = installmentDueDate.getFullYear();

			const originalDueDate = new Date(installment.installment_due);
			const constantDay = originalDueDate.getUTCDate() + 1;

			if (nextMonth > 11) {
				nextMonth = 0;
				nextYear++;
			}

			// Create new date using UTC to maintain the exact day
			const newDueDate = new Date(Date.UTC(nextYear, nextMonth, constantDay));

			const { data: installmentData, error: updateError } = await supabase
				.from("installments")
				.update({ latest_payment_date: newDueDate.toISOString() })
				.eq("id", installment?.id)
				.select();

			const latestPaymentDate = new Date(paymentData.payment_date);
			const originalInstallmentDueDate = new Date(installment.installment_due);

			//changes from sir jeff
			//check the month and year of the payment date and if it is equal to the installment_due's month and year
			//update the status to Fully-paid
			//if (
			//	latestPaymentDate.getMonth() === originalInstallmentDueDate.getMonth() &&
			//	latestPaymentDate.getFullYear() === originalInstallmentDueDate.getFullYear()
			//) {
			//	await supabase
			//		.from("installments")
			//		.update({ status: "Fully-paid" })
			//		.eq("id", installment.id);
			//	setIsFullyPaid(false);
			//}

			if (updateError) throw updateError;

			const { error: salesError } = await supabase.from("sales").insert({
				amount: paymentData.payment,
				payment_method: "Cash",
				date_issued: new Date(),
				branch_id: cred.branch_id,
				installment_id: installment?.id,
			});

			if (salesError) throw salesError;

			const { data: empData, error: empErr } = await supabase
				.from("employees")
				.select("number_of_transactions")
				.eq("user_id", cred.id);

			if (empErr) throw empErr;

			const currTransactions = empData?.[0]?.number_of_transactions || 0;

			const { error: empError2 } = await supabase
				.from("employees")
				.update({ number_of_transactions: currTransactions + 1 })
				.eq("user_id", cred.id);

			if (empError2) throw empError2;

			const { error: logError } = await supabase.from("logs").insert({
				log_label: `${cred.name} accepted an installment payment of ${installment?.customer_name}`,
				log_category: "Installment Payment",
				installment_id: installment?.id,
				user_id: cred?.id,
			});

			if (logError) throw logError;

			if (error) {
				toast.error("Error saving new payment. Please try again");
				return;
			}

			fetchMonthsPaid();
			toast.success("Payment accepted and record added to database");
		} catch (err) {
			// Improved error handling
			console.error("Error adding new payment:", err);
			toast.error(
				"Error adding new payment. Please check your connection and try again"
			);
		}
	};

	const handleSaveInstallmentStatusUpdate = async () => {
		try {
			const { data, error } = await supabase
				.from("installments")
				.update({
					yellow: yellow !== 0 ? yellow : installment?.yellow || 0,
					purple: purple !== 0 ? purple : installment?.purple || 0,
					white: installment?.white || purple + yellow || 0,
					comment: comment !== "" ? comment : installment?.comment || "",
				})
				.eq("id", installment?.id);

			if (error) throw error;

			toast.success("Installment status saved successfully!");
			fetchInstallments();
			closeStatusModal();
		} catch (error) {
			throw new Error(String(error));
		}
	};

	const handleEditMonthly = async (id) => {
		try {
			const { error } = await supabase
				.from("installments")
				.update({
					monthly_payment: paymentVal,
				})
				.eq("id", id);

			if (error) {
				toast.error("Error updating monthly installment. Please try again");
				return;
			}

			toast.success("Monthly updated successsfully");
			fetchInstallments();
			closeStatusModal();
			setIsEditMonthly(false);
			return;
		} catch (err) {}
	};

	const fetchMonthsPaid = async () => {
		try {
			const { data, error } = await supabase
				.from("months_to_pay")
				.select("*")
				.eq("installment_id", installment?.id);

			if (error) {
				toast.error("Error retrieving payments");
				return;
			}
			console.log(data);
			setMonthsPaid(data);
		} catch (err) {
			toast.error("Error retrieving payments");
		}
	};

	useEffect(() => {
		fetchMonthsPaid();
	}, [installment]);

	const term = installment?.term || 0; // Assuming term is in months
	const finalDeadline = new Date(installment?.installment_due);

	return (
		<div className='fixed inset-0 flex items-center justify-center z-[200] bg-black bg-opacity-50'>
			<Toaster
				richColors
				position='top-center'
			/>
			<div className='bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-7xl h-[550px] overflow-y-auto'>
				<div className='flex justify-between items-center'>
					<h2 className='text-2xl font-medium'>
						Installment Status of{" "}
						<span className='font-bold'>{installment?.customer_name}</span>
					</h2>
					<button
						onClick={closeStatusModal}
						className='btn bg-red-500 text-white'>
						Close
					</button>
				</div>
				<p>
					Latest Payment Date:{" "}
					{installment?.latest_payment_date
						? new Date(installment?.latest_payment_date).toLocaleDateString("en-US", {
								year: "numeric",
								month: "long",
								day: "numeric",
						  })
						: "N/A"}
				</p>
				<p>
					Deadline for Entire Installment:{" "}
					{finalDeadline.toLocaleDateString("en-US", {
						year: "numeric",
						month: "long",
						day: "numeric",
					})}
				</p>
				<hr className='my-4' />
				<div className='flex gap-4'>
					<div className='mb-2 w-full'>
						<label className='block mb-2 dark:text-white font-medium'>Monthly</label>
						<div className='flex flex-wrap w-full gap-2'>
							<input
								type='text'
								name='monthly'
								value={
									isEditMonthly
										? paymentVal
										: installment?.monthly_payment?.toFixed(2) || ""
								}
								disabled={!isEditMonthly}
								onChange={(e) => setPaymentVal(e.target.value)}
								className='col-span-1 border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
							/>
							{isEditMonthly ? (
								<div className='flex gap-3 items-center'>
									<button
										onClick={() => handleEditMonthly(installment?.id)}
										className='col-span-1 py-2 bg-green-600 text-white font-semibold px-3 text-center rounded-md'>
										Update Amount
									</button>
									<button
										onClick={() => setIsEditMonthly(false)}
										className='col-span-1 py-2 bg-gray-600 text-white font-semibold px-3 text-center rounded-md'>
										Cancel
									</button>
								</div>
							) : (
								<button
									onClick={() => setIsEditMonthly(true)}
									className='col-span-1 py-2 bg-blue-600 text-white font-semibold px-3 text-center rounded-md'>
									Edit Monthly Payment
								</button>
							)}
						</div>
					</div>
				</div>

				{/* Purple */}
				<div className='mb-2 w-full'>
					<label className='block mb-2 font-medium'>Purple</label>
					<input
						type='number'
						name={purple}
						placeholder={installment?.purple ?? 0}
						onChange={(e) => {
							setPurple(Number(e.target.value));
						}}
						className='border p-2 w-full rounded-md bg-purple-500 text-white'
					/>
				</div>
				{/* Yellow */}
				<div className='mb-2 w-full'>
					<label className='block mb-2 font-medium'>Yellow</label>
					<input
						type='number'
						name={yellow}
						placeholder={installment?.yellow ?? 0}
						onChange={(e) => {
							setYellow(Number(e.target.value));
						}}
						className='border p-2 w-full rounded-md bg-yellow-500 text-yellow-950'
					/>
				</div>
				{/* White */}
				<div className='mb-2 w-full'>
					<label className='block mb-2 font-medium'>White</label>
					<input
						type='number'
						name={white}
						value={installment?.white ?? 0}
						onChange={(e) => {
							setWhite(Number(purple) + Number(yellow));
						}}
						className='border p-2 w-full rounded-md'
					/>
				</div>

				{/**Drop down for input */}
				<div className='my-2 flex flex-col gap-2 md:grid grid-cols-4 items-center'>
					<div className='flex flex-col gap-2'>
						<h1>Select Month</h1>
						<select
							className='mb-4 md:mb-0'
							onChange={(e) =>
								setPaymentData({ ...paymentData, selected_month: e.target.value })
							}>
							{[
								"January",
								"February",
								"March",
								"April",
								"May",
								"June",
								"July",
								"August",
								"September",
								"October",
								"November",
								"December",
							].map((month, idx) => (
								<option
									value={month}
									key={idx}>
									{month}
								</option>
							))}
						</select>
					</div>
					<div className='flex flex-col gap-2'>
						<h1>Amount</h1>
						<input
							onChange={(e) =>
								setPaymentData({ ...paymentData, payment: e.target.value })
							}
							type='number'
							placeholder='Input amount...'
						/>
					</div>
					<div className='flex gap-1 items-center'>
						<div className='flex flex-col gap-2'>
							<h1>Due Date</h1>
							<input
								type='date'
								onChange={(e) =>
									setPaymentData({ ...paymentData, payment_date: e.target.value })
								}
							/>
						</div>
					</div>
					<div className='flex gap-1 items-center'>
						<div className='flex flex-col gap-2'>
							<h1>Payment Date</h1>
							<input
								type='date'
								onChange={(e) =>
									setPaymentData({ ...paymentData, date_paid: e.target.value })
								}
							/>
						</div>
						<div className='flex flex-col gap-2'>
							<h1>&nbsp;</h1>
							<button
								className='btn bg-blue-500 text-white'
								onClick={addNewPayment}>
								Add Payment
							</button>
						</div>
					</div>
				</div>
				<div className='my-4 overflow-x-auto shadow-md sm:rounded-lg'>
					<table className='w-full text-sm text-gray-500'>
						<thead className='bg-indigo-500 text-white'>
							<tr>
								<th className='px-6 py-3 text-center'>Selected Month</th>
								<th className='px-6 py-3 text-center'>Payment Amount</th>
								<th className='px-6 py-3 text-center'>Due Date</th>
								<th className='px-6 py-3 text-center'>Payment Date</th>
								<th className='px-6 py-3 text-center'>Action</th>
							</tr>
						</thead>
						<tbody>
  {monthsPaid.map((payment, index) => (
    <tr key={index}>
      <td className="px-6 py-4 text-center">
        {isEditing === payment.id ? (
          <input
            type="text"
            value={editingData.selected_month}
            onChange={(e) =>
              setEditingData({ ...editingData, selected_month: e.target.value })
            }
          />
        ) : (
          payment.selected_month
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {isEditing === payment.id ? (
          <input
            type="number"
            value={editingData.payment}
            onChange={(e) =>
              setEditingData({ ...editingData, payment: e.target.value })
            }
          />
        ) : (
          payment.payment
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {isEditing === payment.id ? (
          <input
            type="date"
            value={editingData.payment_date}
            onChange={(e) =>
              setEditingData({ ...editingData, payment_date: e.target.value })
            }
          />
        ) : (
          new Date(payment.payment_date).toLocaleDateString("en-US", {
            month: "long",
            day: "2-digit",
            year: "numeric",
          })
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {isEditing === payment.id ? (
          <input
            type="date"
            value={editingData.date_paid}
            onChange={(e) =>
              setEditingData({ ...editingData, date_paid: e.target.value })
            }
          />
        ) : (
          new Date(payment.date_paid).toLocaleDateString("en-US", {
            month: "long",
            day: "2-digit",
            year: "numeric",
          })
        )}
      </td>
      <td className="px-6 py-4 text-center">
        {isEditing === payment.id ? (
          <>
            <button
              onClick={() => updatePayment(payment.id)}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(null)}
              className="bg-gray-500 text-white px-3 py-1 rounded ml-2"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => handleEditClick(payment)}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            Edit
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>

					</table>
				</div>
				<div className='grid grid-cols-3 gap-4'>
					<div className='mb-2 w-full'>
						<label className='block mb-2 font-medium'>TOTAL (JAN to DEC)</label>
						<input
							type='number'
							name={total}
							value={total ?? 0}
							className='border p-2 w-full rounded-md'
						/>
					</div>
					<div className='mb-2 w-full'>
						<label className='block mb-2 dark:text-white font-medium'>Remarks</label>
						<input
							type='text'
							name='remarks'
							value={(installment?.white - total).toFixed(2) || 0}
							disabled
							className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
						/>
					</div>
					<div className='mb-2 w-full'>
						<label className='block mb-2 dark:text-white font-medium'>Comment</label>
						<textarea
							type='text'
							name='comment'
							onChange={(e) => setComment(e.target.value)}
							placeholder={installment?.comment}
							className='border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md'
						/>
					</div>
					<div className='flex gap-2 items-center'>
						<button
							onClick={() =>
								handleDepositRemateOrFullyPaidInstallment(installment?.id, "full")
							}
							className='btn bg-green-500 text-white'>
							Fully-paid
						</button>
						<button
							onClick={() =>
								handleDepositRemateOrFullyPaidInstallment(installment?.id, "deposit")
							}
							className='btn bg-blue-500 text-white'>
							Deposit
						</button>

						<button
							onClick={() =>
								handleDepositRemateOrFullyPaidInstallment(installment?.id, "remate")
							}
							className='btn bg-red-500 text-white'>
							Remate
						</button>
					</div>
				</div>

				<div className='flex justify-end'>
					<button
						onClick={closeStatusModal}
						className='px-4 py-2 bg-gray-400 text-white rounded'>
						Cancel
					</button>
					<button
						onClick={handleSaveInstallmentStatusUpdate}
						className='ml-2 px-7 py-2 bg-green-500 text-white rounded'>
						Save
					</button>
				</div>
			</div>
		</div>
	);
};
