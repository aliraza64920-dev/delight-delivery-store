import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import logoAsset from "@/assets/playtown-logo.png.asset.json";
import { methodLabel } from "@/lib/order-status";

export type LabelData = {
  order_number: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string | null;
  total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: { product_name: string; quantity: number }[];
};

export const payableAmount = (o: LabelData) => (o.payment_method === "cod" && o.payment_status !== "paid" ? Number(o.total) : 0);
const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString("en-PK")}`;

/** Fixed 4 x 6 inch label. Internal store barcode only — not a courier tracking number. */
export function ShippingLabel({ order }: { order: LabelData }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (svg.current) JsBarcode(svg.current, order.order_number, { format: "CODE128", width: 2, height: 60, displayValue: true, fontSize: 16, margin: 0 });
  }, [order.order_number]);
  const due = payableAmount(order);
  return (
    <div id="shipping-label" style={{ width: "4in", height: "6in", padding: "0.2in", boxSizing: "border-box", background: "#fff", color: "#000", fontFamily: "Arial, Helvetica, sans-serif", border: "1px solid #000", display: "flex", flexDirection: "column", gap: "0.1in" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "0.08in" }}>
        <img src={logoAsset.url} alt="Play Town" style={{ height: "0.55in", objectFit: "contain" }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>PLAY TOWN</div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>ORDER #{order.order_number}</div>
          <div style={{ fontSize: 10 }}>{new Date(order.created_at).toLocaleDateString("en-PK", { dateStyle: "medium" })}</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700 }}>SHIP TO:</div>
        <div style={{ fontSize: 15, fontWeight: 800 }}>{order.customer_name}</div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{order.phone}</div>
        <div style={{ fontSize: 12, lineHeight: 1.3 }}>{order.address}</div>
        <div style={{ fontSize: 14, fontWeight: 800 }}>{order.city}{order.postal_code ? ` ${order.postal_code}` : ""}</div>
      </div>
      <div style={{ borderTop: "1px dashed #000", paddingTop: "0.06in", flex: 1, overflow: "hidden" }}>
        <div style={{ fontSize: 10, fontWeight: 700 }}>ITEMS:</div>
        {order.items.slice(0, 5).map((i, k) => (
          <div key={k} style={{ fontSize: 11, display: "flex", justifyContent: "space-between", gap: 6 }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.product_name}</span><span>Qty: {i.quantity}</span>
          </div>
        ))}
        {order.items.length > 5 && <div style={{ fontSize: 10 }}>+ {order.items.length - 5} more item(s)</div>}
      </div>
      <div style={{ border: "2px solid #000", padding: "0.06in", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700 }}>{due > 0 ? "COD AMOUNT" : "AMOUNT DUE"}</div>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{pkr(due)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 700 }}>PAYMENT</div>
          <div style={{ fontSize: 12, fontWeight: 800 }}>{due > 0 ? "CASH ON DELIVERY" : `${methodLabel(order.payment_method).toUpperCase()} — PAID`}</div>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <svg ref={svg} style={{ maxWidth: "100%" }} />
        <div style={{ fontSize: 8 }}>Internal store reference</div>
      </div>
    </div>
  );
}

async function toDataUrl(url: string) {
  try {
    const b = await (await fetch(url)).blob();
    return await new Promise<string>((r) => { const f = new FileReader(); f.onload = () => r(f.result as string); f.readAsDataURL(b); });
  } catch { return null; }
}

export async function downloadLabelPdf(order: LabelData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "in", format: [4, 6] });
  const m = 0.2;
  doc.setLineWidth(0.01).rect(0.05, 0.05, 3.9, 5.9);
  const logo = await toDataUrl(logoAsset.url);
  if (logo) { try { doc.addImage(logo, "PNG", m, m, 0.95, 0.55); } catch { /* ignore */ } }
  doc.setFont("helvetica", "bold").setFontSize(14).text("PLAY TOWN", 3.8, 0.4, { align: "right" });
  doc.setFontSize(11).text(`ORDER #${order.order_number}`, 3.8, 0.6, { align: "right" });
  doc.setFont("helvetica", "normal").setFontSize(8).text(new Date(order.created_at).toLocaleDateString("en-PK", { dateStyle: "medium" }), 3.8, 0.75, { align: "right" });
  doc.setLineWidth(0.02).line(m, 0.85, 3.8, 0.85);
  let y = 1.05;
  doc.setFont("helvetica", "bold").setFontSize(8).text("SHIP TO:", m, y); y += 0.2;
  doc.setFontSize(13).text(order.customer_name, m, y); y += 0.2;
  doc.setFontSize(11).text(order.phone, m, y); y += 0.18;
  doc.setFont("helvetica", "normal").setFontSize(10);
  const addr = doc.splitTextToSize(order.address, 3.6).slice(0, 4);
  doc.text(addr, m, y); y += addr.length * 0.16;
  doc.setFont("helvetica", "bold").setFontSize(12).text(`${order.city}${order.postal_code ? ` ${order.postal_code}` : ""}`, m, y); y += 0.2;
  doc.setLineDashPattern([0.04, 0.04], 0).setLineWidth(0.01).line(m, y, 3.8, y).setLineDashPattern([], 0); y += 0.17;
  doc.setFontSize(8).text("ITEMS:", m, y); y += 0.17;
  doc.setFont("helvetica", "normal").setFontSize(9);
  order.items.slice(0, 5).forEach((i) => {
    doc.text(doc.splitTextToSize(i.product_name, 2.8)[0], m, y);
    doc.text(`Qty: ${i.quantity}`, 3.8, y, { align: "right" }); y += 0.16;
  });
  if (order.items.length > 5) doc.text(`+ ${order.items.length - 5} more item(s)`, m, y);
  const due = payableAmount(order);
  doc.setLineWidth(0.02).rect(m, 4.1, 3.6, 0.55);
  doc.setFont("helvetica", "bold").setFontSize(8).text(due > 0 ? "COD AMOUNT" : "AMOUNT DUE", m + 0.08, 4.25);
  doc.setFontSize(16).text(pkr(due), m + 0.08, 4.52);
  doc.setFontSize(8).text("PAYMENT", 3.72, 4.25, { align: "right" });
  doc.setFontSize(10).text(due > 0 ? "CASH ON DELIVERY" : `${methodLabel(order.payment_method).toUpperCase()} - PAID`, 3.72, 4.5, { align: "right" });
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, order.order_number, { format: "CODE128", width: 4, height: 120, displayValue: true, fontSize: 32, margin: 0 });
  doc.addImage(canvas.toDataURL("image/png"), "PNG", 0.6, 4.8, 2.8, 0.9);
  doc.setFont("helvetica", "normal").setFontSize(6).text("Internal store reference", 2, 5.82, { align: "center" });
  doc.save(`label-${order.order_number}.pdf`);
}
