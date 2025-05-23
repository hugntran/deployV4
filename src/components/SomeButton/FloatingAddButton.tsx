import { Link } from "react-router-dom";

interface FloatingAddButtonProps {
  to: string;
}

const FloatingAddButton = ({ to }: FloatingAddButtonProps) => {
  return (
    <Link to={to} className="bg-blue-600 text-white font-medium px-3 py-2 rounded-md shadow-sm hover:bg-blue-700 transition flex items-center justify-center h-full self-center ml-auto">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 mr-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
      Add
    </Link>
  );
};

export default FloatingAddButton;
