import { create } from "zustand";
import { useCallback, useEffect } from "react";
import supabase from "../lib/supabase";

export const useProductStore = create((set) => ({
	products: [],
	productGroups: [],
	setProductGroups: (productGroups) => set({ productGroups }),
	setProducts: (products) => set({ products }),
}));

export const useCredStore = create((set) => ({
	cred: {
		branch_id: null,
		email: "",
		id: null,
		name: "",
		role: "",
	},
	setCreds: () => {
		useEffect(() => {
			try {
				const storedCreds = localStorage.getItem("admin");
				if (storedCreds) {
					const creds = JSON.parse(storedCreds);
					set({ cred: creds });
				}
			} catch (error) {
				console.error("Failed to load credentials from localStorage:", error);
			}
		}, []);
	},
}));

export const useProductLoad = () => {
	const { cred } = useCredStore();
	const { setProducts, setProductGroups } = useProductStore();

	const loadProduct = useCallback(async () => {
		try {
			const { data: productData, error: productError } = await supabase
				.from("products")
				.select("*")
				.eq("branch_id", cred?.branch_id);

			if (productError) throw new Error("Error retrieving product groups.");

			setProductGroups(productData);

			if (productData.length > 0) {
				const productIds = productData.map((product) => product.id);
				const { data: itemsData, error: itemsError } = await supabase
					.from("items")
					.select("*")
					.in("product_id", productIds);

				if (itemsError) throw new Error("Error retrieving items.");
				setProducts(itemsData);
			}
		} catch (err) {
			console.error(err);
			alert("Error retrieving product groups and items.");
		}
	}, [cred, setProducts, setProductGroups]);

	return { loadProduct };
};

export const useSalesStore = create((set) => ({
	sales: [],
	totalSales: [],
	totalSalesPerBranch: [],
	allSales: {
		profit: 0,
	},
	setSales: (sales) => set({ sales }),
	setAllSales: (allSales) => set({ allSales }),
	setTotalSales: (totalSales) => set({ totalSales }),
	setTotalSalesPerBranch: (totalSalesPerBranch) => set({ totalSalesPerBranch }),
}));

export const useDirectPurchasesStore = create((set) => ({
	directPurchases: [],
	setDirectPurchases: (directPurchases) => set({ directPurchases }),
}));

export const useBranchesStore = create((set) => ({
	branches: [],
	setBranches: (branches) => set({ branches }),
}));

export const useCustomerStore = create((set) => ({
	customers: [],
	setCustomers: (customers) => set({ customers }),
}));

export const useExpensesStore = create((set) => ({
	expenses: [],
	allExpenses: [],
	allExpensesAdmin: [],
	setExpenses: (expenses) => set({ expenses }),
	setAllExpenses: (allExpenses) => set({ allExpenses }),
	setAllExpensesAdmin: (allExpensesAdmin) => set({ allExpensesAdmin }),
}));

export const useTop = create((set) => ({
	result: [],
	setResult: (result) => set({ result }),
}));

export const useDatePick = create((set) => ({
	date: [],
	setDate: (date) => set({ date }),
}));

export const useInstallmentStore = create((set) => ({
	installments: [],
	installmentsForSpecific: [],
	setInstallments: (installments) => set({ installments }),
	setInstallmentsForSpecific: (installmentsForSpecific) =>
		set({ installmentsForSpecific }),
}));

export const useFinancingStore = create((set) => ({
	financing: [],
	financingForSpecific: [],
	setFinancing: (financing) => set({ financing }),
	setFinancingForSpecific: (financingForSpecific) =>
		set({ financingForSpecific }),
}));
