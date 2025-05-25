import { useMemo } from "react";

/**

 *
 * @param tickets 
 * @returns
 */
export function useTicketGroups(tickets: any[]) {
  const upComing = useMemo(() => {
    return tickets.filter((t) => t.isCheckIn === null && t.status !== "PAYMENT_EXPIRED" && t.status !== "PAYMENT_REQUIRED" && t.status !== "CANCELED" && new Date(t.endDateTime) > new Date());
  }, [tickets]);

  const onService = useMemo(() => {
    return tickets.filter((t) => t.isCheckIn === true && t.isCheckOut === null && new Date(t.endDateTime) > new Date());
  }, [tickets]);

  const overdue = useMemo(() => {
    return tickets.filter((t) => t.isCheckIn === true && t.isCheckOut === null && new Date(t.endDateTime) < new Date());
  }, [tickets]);

  return { upComing, overdue, onService };
}
