import React from "react";

export const ExpEdit = ({ expense, closeExpModal }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg w-full max-w-md max-h-full">
        <h2 className="text-2xl text-black font-semibold dark:text-white mb-4">Edit Expense</h2>
        <hr className="mb-4"></hr>
        <div className="mb-4">
          <label className="block mb-2 dark:text-white">Branch Name</label>
          <input
            type="text"
            value={expense.branch_name}
            className="border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 dark:text-white">Amount</label>
          <input
            type="text"
            value={expense.amount}
            className="border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 dark:text-white">Remarks</label>
          <textarea
            value={expense.remarks}
            className="border bg-gray-50 dark:bg-slate-600 p-2 w-full text-gray-900 dark:text-white rounded-md"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={closeExpModal}
            className="px-4 py-2 text-white bg-gray-400 rounded"
          >
            Cancel
          </button>
          <button className="ml-2 px-7 py-2 bg-indigo-500 text-white rounded">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
