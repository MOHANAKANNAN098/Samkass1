import { jsPDF } from "jspdf";
import type { Client, Loan, Payment, Settings } from "../types";
import { formatCurrency, formatDate } from "./calculations";
import { getReceiptNumber, incrementReceiptNumber } from "./storage";

export { getReceiptNumber, incrementReceiptNumber };

export function generateReceipt(
  payment: Payment,
  loan: Loan,
  client: Client,
  settings: Settings,
  receiptNumber: number,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const pageW = 148;
  const margin = 14;
  let y = 18;

  // Header background
  doc.setFillColor(10, 14, 26);
  doc.rect(0, 0, pageW, 36, "F");

  // KaasFlow title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(245, 158, 11);
  doc.text("KaasFlow", margin, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text(settings.financierName || "Financier", margin, y);
  doc.text(settings.businessName || "", pageW / 2, y, { align: "center" });
  y += 14;

  // Receipt number + date
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Receipt No: KF-${String(receiptNumber).padStart(4, "0")}`,
    margin,
    y,
  );
  doc.text(`Date: ${formatDate(payment.date)}`, pageW - margin, y, {
    align: "right",
  });
  y += 8;

  // Divider
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // Client info
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(10, 14, 26);
  doc.text("Client Details", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name   : ${client.name}`, margin, y);
  y += 5;
  doc.text(`Phone  : +91 ${client.phone}`, margin, y);
  y += 10;

  // Loan + payment info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment Details", margin, y);
  y += 6;

  const rows: [string, string][] = [
    ["Loan Amount", formatCurrency(loan.amount)],
    ["EMI Amount", formatCurrency(loan.emi)],
    ["Amount Paid", formatCurrency(payment.amount)],
    ["Payment Mode", payment.mode.toUpperCase()],
    ["Payment Date", formatDate(payment.date)],
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const [label, value] of rows) {
    doc.setTextColor(80, 80, 80);
    doc.text(`${label}`, margin, y);
    doc.setTextColor(10, 14, 26);
    doc.setFont("helvetica", "bold");
    doc.text(value, pageW - margin, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 6;
  }
  y += 4;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // Thank you message
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(16, 185, 129);
  doc.text("நன்றி! Thank you for your payment.", pageW / 2, y, {
    align: "center",
  });
  y += 10;

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  doc.text("Powered by KaasFlow • caffeine.ai", pageW / 2, y, {
    align: "center",
  });

  doc.save(`KaasFlow_Receipt_KF-${String(receiptNumber).padStart(4, "0")}.pdf`);
}
