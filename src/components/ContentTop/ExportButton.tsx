import { Download } from "@mui/icons-material";
import clsx from "clsx";

const ExportButton = () => {
  return (
    <button className={clsx("flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white", "font-medium px-4 py-2 rounded-lg shadow-md transition-all")}>
      <Download />
      Export
    </button>
  );
};

export default ExportButton;
