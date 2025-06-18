import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session param" }, { status: 400 });
  }

  // fetch order by stripe_session_id
  const supabase = createClient(cookies());
  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, email, total, currency, created_at, order_items(item_id, qty, name, price)")
    .eq("stripe_session_id", sessionId)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!orders || orders.length === 0) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = orders[0] as any;

  try {
    // Create PDF in memory
    const doc = new PDFDocument({ margin: 50 });
    const streamPromise = new Promise<Buffer>((resolve, reject) => {
      const streamChunks: Buffer[] = [];
      doc.on('data', (chunk) => {
        streamChunks.push(Buffer.from(chunk));
      });
      doc.on('end', () => {
        resolve(Buffer.concat(streamChunks));
      });
      doc.on('error', (err) => {
        console.error("PDFKit stream error:", err); // Log pdfkit internal stream errors
        reject(err);
      });
    });

    doc.fontSize(20).text("The Water Bar", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Receipt`, { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Order ID: ${order.id}`);
    doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`);
    if (order.email) doc.text(`Email: ${order.email}`);
    doc.moveDown();

    doc.text("Items:");
    order.order_items.forEach((item: any) => {
      doc.text(`${item.qty}x ${item.name} - $${Number(item.price).toFixed(2)}`);
    });
    doc.moveDown();
    doc.text(`Total: $${Number(order.total).toFixed(2)}`, { align: "right" });

    doc.end();
    const pdfBuffer = await streamPromise;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=receipt-${order.id}.pdf`,
      },
    });
  } catch (pdfError: any) {
    console.error("Error generating PDF:", pdfError);
    return NextResponse.json(
      { error: "Failed to generate PDF receipt.", details: pdfError.message },
      { status: 500 }
    );
  }
}
