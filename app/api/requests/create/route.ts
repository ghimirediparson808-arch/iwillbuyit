import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIpHash } from "@/lib/client-ip";

export async function POST(request: NextRequest) {
  let uploadedPath: string | null = null;
  let adminClient;

  try {
    adminClient = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Backend storage client unavailable." },
      { status: 500 },
    );
  }

  try {
    // 1. Rate Limiting Check (Atomic RPC call with fixed limits)
    const ipHash = getClientIpHash(request);
    const { data: rateAllowed, error: rateError } = await adminClient.rpc(
      "check_rate_limit",
      {
        p_ip_hash: ipHash,
        p_max_requests: 5,
        p_window_seconds: 600,
      },
    );

    if (rateError || rateAllowed === false) {
      return NextResponse.json(
        { error: "Too many request submissions. Please wait 10 minutes." },
        { status: 429 },
      );
    }

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const contactName = formData.get("contactName")?.toString().trim() || "";
    const contactPhone = formData.get("contactPhone")?.toString().trim() || "";
    const contactEmail = formData.get("contactEmail")?.toString().trim() || "";
    const ideaDescription = formData.get("ideaDescription")?.toString().trim() || "";
    const selectedColour = formData.get("selectedColour")?.toString().trim() || "navy";
    const printSide = formData.get("printSide")?.toString().trim() || "front";
    const size = formData.get("size")?.toString().trim() || "M";
    const quantity = parseInt(formData.get("quantity")?.toString() || "1", 10);
    const neededByDate = formData.get("neededByDate")?.toString().trim() || "";
    const rawConsent = formData.get("consent");
    const consent = rawConsent === "true";
    const designId = formData.get("designId")?.toString().trim() || "";
    const requestType = formData.get("requestType")?.toString().trim() || "custom";

    // Strict Consent Validation: missing or false consent is explicitly rejected
    if (rawConsent === null || !consent) {
      return NextResponse.json(
        { error: "Customer consent is required and must be explicitly true." },
        { status: 400 },
      );
    }

    if (contactName.length < 2 || contactName.length > 100) {
      return NextResponse.json(
        { error: "Customer name must be between 2 and 100 characters." },
        { status: 400 },
      );
    }

    const normalizedPhone = contactPhone.replace(/\D/g, "");
    if (normalizedPhone.length < 7 || normalizedPhone.length > 15) {
      return NextResponse.json(
        { error: "Valid phone number with 7 to 15 digits is required." },
        { status: 400 },
      );
    }

    if (quantity < 1 || quantity > 1000) {
      return NextResponse.json(
        { error: "Quantity must be between 1 and 1000." },
        { status: 400 },
      );
    }

    // 3. Handle Optional Reference File Upload
    const file = formData.get("file") as File | null;
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Uploaded reference file must be 10 MB or smaller." },
          { status: 400 },
        );
      }

      const allowedMimes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
      if (!allowedMimes.includes(file.type)) {
        return NextResponse.json(
          { error: "Allowed file formats: PNG, JPEG, WebP, PDF." },
          { status: 400 },
        );
      }

      // Magic Bytes Header Inspection
      const buffer = new Uint8Array(await file.arrayBuffer());
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
      const isJpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
      const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
      const isWebp =
        String.fromCharCode(...buffer.slice(0, 4)) === "RIFF" &&
        String.fromCharCode(...buffer.slice(8, 12)) === "WEBP";

      if (!(isPng || isJpg || isPdf || isWebp)) {
        return NextResponse.json(
          { error: "Invalid file content or signature." },
          { status: 400 },
        );
      }

      const ext = isPng ? "png" : isJpg ? "jpg" : isPdf ? "pdf" : "webp";
      const filename = `${crypto.randomUUID()}.${ext}`;
      uploadedPath = filename;

      const { error: uploadError } = await adminClient.storage
        .from("request-uploads")
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: "Could not save reference upload." },
          { status: 500 },
        );
      }
    }

    // 4. Call Transactional Database RPC Function
    const { data: rpcRes, error: rpcError } = await adminClient.rpc(
      "submit_customer_request",
      {
        p_data: {
          contactName,
          contactPhone,
          contactEmail,
          ideaDescription,
          selectedColour,
          printSide,
          size,
          quantity,
          neededByDate,
          consent: true,
          referenceUploadPath: uploadedPath ? `request-uploads/${uploadedPath}` : null,
          designId: designId || null,
          requestType,
        },
      },
    );

    if (rpcError || !rpcRes) {
      // Clean up orphaned upload file if database transaction failed
      if (uploadedPath) {
        await adminClient.storage
          .from("request-uploads")
          .remove([uploadedPath]);
      }
      return NextResponse.json(
        { error: rpcError?.message || "Failed to create request." },
        { status: 500 },
      );
    }

    // Return ONLY safe response fields (success & request_code; internal UUID omitted)
    return NextResponse.json({
      success: true,
      requestCode: rpcRes.request_code,
    });
  } catch (err: unknown) {
    // Clean up orphaned upload on unexpected exception
    if (uploadedPath && adminClient) {
      await adminClient.storage
        .from("request-uploads")
        .remove([uploadedPath]);
    }

    const message = err instanceof Error ? err.message : "Request submission failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
