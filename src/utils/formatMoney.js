const formatMoney = (amount) => {
	if (!amount) return 0;
	return (
		typeof amount === "number" &&
		amount
			.toFixed(2)
			.toString()
			.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	);
};

export default formatMoney;
