import React, { useState, useEffect } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const [inputPage, setInputPage] = useState(currentPage);

  useEffect(() => {
    setInputPage(currentPage);
  }, [currentPage]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!isNaN(Number(value)) && Number(value) > 0 && Number(value) <= totalPages) {
      setInputPage(Number(value));
    }
  };

  const handleSubmit = () => {
    if (inputPage >= 1 && inputPage <= totalPages) {
      onPageChange(inputPage);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex justify-center mt-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 border bg-gray-200 rounded-l">
        Previous
      </button>

      <div className="flex items-center">
        <input type="number" value={inputPage} onChange={handleInputChange} onKeyDown={handleKeyPress} className="px-4 py-2 border bg-white text-center w-16" />
        <span className="px-2">/ {totalPages}</span>
      </div>

      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 border bg-gray-200 rounded-r">
        Next
      </button>
    </div>
  );
};

export default Pagination;
