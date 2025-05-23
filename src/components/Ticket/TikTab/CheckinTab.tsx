import { LoadingButton } from "@mui/lab";
import { CheckCircle } from "@mui/icons-material";
import { TableRow, TableCell, TableBody, TableHead, Table, TableContainer, Typography } from "@mui/material";
import { useAction } from "../../../hooks/useAction";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { API_BASE_URL } from "../../../config";

const MySwal = withReactContent(Swal);

interface CheckinTabProps {
  tickets: {
    id: string;
    ticket: {
      id: string;
      startDateTime: string;
      endDateTime: string;
      serviceProvidedEnum: string;
      isCheckIn: boolean;
    };
    slot: {
      slotNumber: string;
      zone?: string;
      gate?: string;
    };
  }[];
  onRefresh: () => void;
}

export default function CheckinTab({ tickets, onRefresh }: CheckinTabProps) {
  const { handleAction, loadingIndex } = useAction({
    url: `${API_BASE_URL}/app-data-service/tickets/checkin-approve/:id`,
    successMessage: "Mission completed",
    errorMessage: "Pathetic",
  });

  const formatDate = (date: string) => new Date(date).toLocaleString();

  const handleConfirmAction = async (id: string, index: number) => {
    const result = await MySwal.fire({
      title: "Confirm Check-in",
      text: "Are you sure you want to proceed with the check in for this ticket?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, confirm it!",
    });

    if (result.isConfirmed) {
      await handleAction(id, index);
      onRefresh();
    }
  };

  return (
    <>
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
              <TableCell>Confirm</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography>No tickets available.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tickets.map(({ id, ticket, slot }, index) => (
                <TableRow key={ticket.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{ticket.id.slice(0, 8).toUpperCase()}</TableCell>
                  <TableCell>{slot?.slotNumber && (slot?.zone || slot?.gate) ? `${slot.slotNumber} - ${slot?.zone || slot?.gate}` : "N/A"}</TableCell>{" "}
                  <TableCell>{formatDate(ticket.startDateTime)}</TableCell>
                  <TableCell>{formatDate(ticket.endDateTime)}</TableCell>
                  <TableCell>{ticket.serviceProvidedEnum}</TableCell>
                  <TableCell>
                    <LoadingButton
                      loading={loadingIndex === index}
                      loadingPosition="start"
                      startIcon={<CheckCircle />}
                      variant="contained"
                      sx={{
                        backgroundColor: "#4CAF50",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "#388E3C",
                        },
                      }}
                      onClick={() => handleConfirmAction(id, index)}
                    >
                      Check
                    </LoadingButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
