export interface TicketData {
  id: string;
  bookingId: string;
  locationId: string;
  slotId: string;
  qrCode: string;
  userId: string;
  serviceProvidedEnum: "PARKING" | "CHARGING";
  status: string;
  description: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  startDateTime: string;
  endDateTime: string;
  previousEndDateTime?: string | null;
  extensionPrice?: number | null;
  ticketCausingConflictId?: string | null;
  isWantingExtension?: boolean | null;
  isCheckIn?: boolean | null;
  isCheckOut?: boolean | null;
  overTimeFine?: number | null;
  vehicleDescription?: string | null;
  actualLeaveTime?: string | null;

  // Dữ liệu mở rộng ở cùng cấp
  slotNumber: string;
  zoneGate: string;
  locationName: string;
}
