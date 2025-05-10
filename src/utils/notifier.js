import supabase from "../lib/supabase";
import { toast } from "sonner";
import { useCredStore } from "../store/data";

export const fetchInstallmentsAndNotify = async (branch_id) => {
	try {
		const { data, count, error } = await supabase
			.from("installments")
			.select(
				`
         *, items (id, item_name, item_imei, serial, item_price), 
         months_to_pay (*)
       `,
				{ count: "exact" }
			)
			.eq("branch_id", branch_id)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Supabase error:", error);
			toast.error("Failed to retrieve installments.");
			return;
		}

		if (data) {
			notifyInstallmentStatus(data);
		}
	} catch (err) {
		console.error("Unexpected error:", err);
		toast.error("An unexpected error occurred while fetching installments.");
	}
};

// Helper function to trigger Sonner toasts
const notifyInstallmentStatus = (installments) => {
	const today = new Date();
	// Set today's date to midnight to ignore time component
	today.setHours(0, 0, 0, 0);

	installments.forEach((installment) => {
		const dueDate = new Date(installment.latest_payment_date);
		// Set dueDate to midnight to ignore time component
		dueDate.setHours(0, 0, 0, 0);
		const diffDays = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24));
		const { status } = installment;

		console.log(dueDate, diffDays);

		if (diffDays === 0) {
			// Due today
			toast.info(
				`${installment.customer_name}'s installment is due today! Please remind them. Call ${installment.phone}`,
				{ duration: 5000 }
			);
		} else if (diffDays < 0 && diffDays >= -7) {
			// Overdue within 7 days
			toast.warning(
				`${installment.customer_name}'s installment is overdue by ${Math.abs(
					diffDays
				)} day(s)! Contact him/her to notify. Call ${installment.phone}`,
				{ duration: 5000 }
			);
		} else if (diffDays < -7 && diffDays >= -14) {
			// Overdue within 14 days
			toast.warning(
				`${installment.customer_name}'s installment is overdue for more than a week but less than two weeks. Check the installment status. Call ${installment.phone}`,
				{ duration: 5000 }
			);
		}
	});
};
