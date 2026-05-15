import type { Client, Loan, Payment } from "../types";
import { calculateEMI } from "./calculations";
import {
  getClients,
  saveClients,
  saveLoans,
  savePayments,
  setReceiptCounter,
} from "./storage";

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function generateSampleData(): void {
  if (getClients().length > 0) return; // Already seeded

  const clients: Client[] = [
    {
      id: "c_001",
      name: "Murugan Selvam",
      phone: "9876543210",
      address: "12, Gandhi Nagar, Coimbatore",
      idno: "4567 8901 2345",
      occ: "Shop Owner",
      createdAt: monthsAgo(6),
    },
    {
      id: "c_002",
      name: "Kavitha Rajan",
      phone: "9765432109",
      address: "5, Anna Street, Tirunelveli",
      idno: "3456 7890 1234",
      occ: "Tailoring",
      createdAt: monthsAgo(5),
    },
    {
      id: "c_003",
      name: "Senthil Kumar",
      phone: "9654321098",
      address: "78, Nehru Road, Madurai",
      idno: "2345 6789 0123",
      occ: "Auto Driver",
      createdAt: monthsAgo(4),
    },
  ];

  const loans: Loan[] = [
    {
      id: "l_001",
      clientId: "c_001",
      amount: 50000,
      interest: 2,
      duration: 12,
      type: "flat",
      startDate: monthsAgo(5),
      emi: calculateEMI(50000, 2, 12, "flat"),
      status: "active",
    },
    {
      id: "l_002",
      clientId: "c_001",
      amount: 25000,
      interest: 1.5,
      duration: 6,
      type: "reducing",
      startDate: monthsAgo(2),
      emi: calculateEMI(25000, 1.5, 6, "reducing"),
      status: "active",
    },
    {
      id: "l_003",
      clientId: "c_002",
      amount: 30000,
      interest: 2,
      duration: 10,
      type: "flat",
      startDate: monthsAgo(4),
      emi: calculateEMI(30000, 2, 10, "flat"),
      status: "active",
    },
    {
      id: "l_004",
      clientId: "c_003",
      amount: 15000,
      interest: 2.5,
      duration: 6,
      type: "reducing",
      startDate: monthsAgo(3),
      emi: calculateEMI(15000, 2.5, 6, "reducing"),
      status: "active",
    },
    {
      id: "l_005",
      clientId: "c_002",
      amount: 10000,
      interest: 2,
      duration: 4,
      type: "flat",
      startDate: monthsAgo(5),
      emi: calculateEMI(10000, 2, 4, "flat"),
      status: "completed",
    },
  ];

  const payments: Payment[] = [
    // Loan l_001 — 5 paid months
    {
      id: "p_001",
      loanId: "l_001",
      amount: Math.round(loans[0].emi),
      date: monthsAgo(5),
      mode: "cash",
      status: "paid",
    },
    {
      id: "p_002",
      loanId: "l_001",
      amount: Math.round(loans[0].emi),
      date: monthsAgo(4),
      mode: "upi",
      status: "paid",
    },
    {
      id: "p_003",
      loanId: "l_001",
      amount: Math.round(loans[0].emi),
      date: monthsAgo(3),
      mode: "cash",
      status: "paid",
    },
    {
      id: "p_004",
      loanId: "l_001",
      amount: Math.round(loans[0].emi),
      date: monthsAgo(2),
      mode: "cash",
      status: "paid",
    },
    {
      id: "p_005",
      loanId: "l_001",
      amount: 0,
      date: monthsAgo(1),
      mode: "cash",
      status: "missed",
      note: "Client not available",
    },
    // Loan l_002 — 1 paid month
    {
      id: "p_006",
      loanId: "l_002",
      amount: Math.round(loans[1].emi),
      date: monthsAgo(2),
      mode: "upi",
      status: "paid",
    },
    // Loan l_003 — 3 paid months + 1 missed
    {
      id: "p_007",
      loanId: "l_003",
      amount: Math.round(loans[2].emi),
      date: monthsAgo(4),
      mode: "cash",
      status: "paid",
    },
    {
      id: "p_008",
      loanId: "l_003",
      amount: Math.round(loans[2].emi),
      date: monthsAgo(3),
      mode: "bank",
      status: "paid",
    },
    {
      id: "p_009",
      loanId: "l_003",
      amount: Math.round(loans[2].emi),
      date: monthsAgo(2),
      mode: "cash",
      status: "paid",
    },
    // Loan l_004 — 2 paid months + 1 missed
    {
      id: "p_010",
      loanId: "l_004",
      amount: Math.round(loans[3].emi),
      date: monthsAgo(3),
      mode: "cash",
      status: "paid",
    },
    {
      id: "p_011",
      loanId: "l_004",
      amount: 0,
      date: monthsAgo(2),
      mode: "cash",
      status: "missed",
      note: "Refused to pay",
    },
    {
      id: "p_012",
      loanId: "l_004",
      amount: Math.round(loans[3].emi),
      date: daysAgo(10),
      mode: "upi",
      status: "paid",
    },
    // Loan l_005 — all 4 paid
    {
      id: "p_013",
      loanId: "l_005",
      amount: Math.round(loans[4].emi),
      date: monthsAgo(5),
      mode: "cash",
      status: "paid",
    },
    {
      id: "p_014",
      loanId: "l_005",
      amount: Math.round(loans[4].emi),
      date: monthsAgo(4),
      mode: "cash",
      status: "paid",
    },
    {
      id: "p_015",
      loanId: "l_005",
      amount: Math.round(loans[4].emi),
      date: monthsAgo(3),
      mode: "upi",
      status: "paid",
    },
    {
      id: "p_016",
      loanId: "l_005",
      amount: Math.round(loans[4].emi),
      date: monthsAgo(2),
      mode: "cash",
      status: "paid",
    },
  ];

  saveClients(clients);
  saveLoans(loans);
  savePayments(payments);
  setReceiptCounter(1);
}
