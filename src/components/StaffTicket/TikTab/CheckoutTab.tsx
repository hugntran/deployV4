import { TableRow, TableCell, TableBody, TableHead, Table, TableContainer, Typography, Button, CircularProgress } from "@mui/material";
import { useAction } from "../../../hooks/useAction";
import { CheckCircle } from "@mui/icons-material";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useFetchData } from "../../../hooks/useFetchData";
import { API_BASE_URL } from "../../../config";

const formatDate = (date: string) => new Date(date).toLocaleString();
const MySwal = withReactContent(Swal);

const imageList = [...Array(24).keys()].map((i) => `car${i + 1}.jpg`);

const getRandomImages = (count: number) => {
  const shuffled = [...imageList].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

interface CheckoutTabProps {
  tickets: {
    id: string;
    ticket: {
      id: string;
      startDateTime: string;
      endDateTime: string;
      serviceProvidedEnum: string;
      overTimeFine: number | null;
    };
    slot: {
      slotNumber: string;
      zone?: string;
      gate?: string;
    };
  }[];
  onRefresh?: () => void;
}

export default function CheckoutTab({ tickets, onRefresh }: CheckoutTabProps) {
  const { handleAction, loadingIndex } = useAction({
    url: `${API_BASE_URL}/app-data-service/tickets/checkout-approve/:id`,
    successMessage: "See you later",
    errorMessage: "Hold up",
  });

  const { data: checkinRequests } = useFetchData<any>({
    url: `${API_BASE_URL}/app-data-service/tickets/checkin-requests?page=0&size=100`,
  });

  const renderOvertimeFine = (fine: number | null) => {
    if (fine == null || fine === 0) return "$ 0.00";
    return fine > 0 ? <span style={{ color: "red" }}>{`$ ${fine.toFixed(2)}`}</span> : `$ ${fine.toFixed(2)}`;
  };

  const handleConfirmCheckout = async (id: string, index: number) => {
    const ticketId = tickets[index].ticket.id;
    const overtimeFine = tickets[index].ticket.overTimeFine;
    const image = getRandomImages(1)[0];

    const checkTime = new Date().toLocaleString();

    const matchedCheckin = checkinRequests.find((item) => item.ticket?.id === ticketId);
    const updatedAt = matchedCheckin?.updatedAt;
    const formattedUpdateTime = updatedAt ? new Date(updatedAt).toLocaleString() : "N/A";

    MySwal.fire({
      title: "Confirm Vehicle Checkout",
      html: `
<div style="font-family: 'Segoe UI', sans-serif; color: #333; text-align: center; max-width: 600px; margin: 0 auto;">
<div style="border-bottom: 2px solid #ddd; padding-bottom: 10px;">
  <div style="font-size: 16.5px; font-weight: 600; color: #444;">
    Extra Fee:&nbsp;
    <span style="font-size: 22px; font-weight: bold; color: ${overtimeFine && overtimeFine > 0 ? "red" : "#555"};">
      ${overtimeFine && overtimeFine > 0 ? `$ ${overtimeFine.toFixed(2)}` : "$ 0.00"}
    </span>
  </div>
</div>
  <div style="margin-bottom: 16px;">
    <div style="font-weight: 600; font-size: 16px; color: #444;">Entry Camera Image</div>
    <div style="font-size: 14px; color: #777;">Last Vehicle Entry: ${formattedUpdateTime}</div>
  </div>

  <div style="display: flex; gap: 16px; justify-content: center; margin-bottom: 10px;">
    <img src="/images/car/${image}" alt="Arrival 1" style="width: 180px; height: 120px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />
    <img src="/images/car/${image}" alt="Arrival 2" style="width: 180px; height: 120px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />
  </div>

  <div style="margin-bottom: 16px;">
    <div style="font-weight: 600; font-size: 16px; color: #444;">Exit Camera Image</div>
    <div style="font-size: 14px; color: #777;">Vehicle Released At: ${checkTime}</div>
  </div>

  <div style="display: flex; gap: 16px; justify-content: center;">
    <img src="/images/car/${image}" alt="Departure 1" style="width: 180px; height: 120px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />
    <img src="/images/car/${image}" alt="Departure 2" style="width: 180px; height: 120px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" />
  </div>
</div>
    `,
      width: 700,
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        handleAction(id, index).then(() => {
          onRefresh?.();
        });
      }
    });
  };

  return (
    <TableContainer>
      <Table size="medium" sx={{ tableLayout: "fixed", width: "100%" }}>
        <TableHead>
          <TableRow className="bg-gray-100">
            <TableCell>No</TableCell>
            <TableCell>Ticket Id</TableCell>
            <TableCell>Lot</TableCell>
            <TableCell>Start Time</TableCell>
            <TableCell>End Time</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>Extra Fee</TableCell>
            <TableCell>Confirm</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tickets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography>No tickets available.</Typography>
              </TableCell>
            </TableRow>
          ) : (
            tickets.map(({ id, ticket, slot }, index) => (
              <TableRow key={ticket.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{ticket.id.slice(0, 8).toUpperCase()}</TableCell>
                <TableCell>{slot?.slotNumber && (slot?.zone || slot?.gate) ? `${slot.slotNumber} - ${slot?.zone || slot?.gate}` : "N/A"}</TableCell>
                <TableCell>{formatDate(ticket.startDateTime)}</TableCell>
                <TableCell>{formatDate(ticket.endDateTime)}</TableCell>
                <TableCell>{ticket.serviceProvidedEnum}</TableCell>
                <TableCell
                  sx={{
                    backgroundColor: ticket.overTimeFine && ticket.overTimeFine > 0 ? "rgba(255, 0, 0, 0.1)" : "transparent",
                  }}
                >
                  {renderOvertimeFine(ticket.overTimeFine)}
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => handleConfirmCheckout(id, index)}
                    variant="contained"
                    sx={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "#388E3C",
                      },
                    }}
                    startIcon={loadingIndex === index ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
                  >
                    {loadingIndex === index ? "Processing..." : "Check"}
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
