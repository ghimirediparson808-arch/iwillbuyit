export type Colour = "navy" | "black" | "cream";
export type Side = "front" | "back";
export type View = "product" | "model";
export type ColourVariant = {
  enabled: boolean;
  background: Colour;
  front?: string;
  back?: string;
  reuseFront?: Colour;
  reuseBack?: Colour;
};
export type Design = {
  schemaVersion?: 2;
  variants?: Record<Colour, ColourVariant>;
  defaultColour?: Colour;
  galleryCover?:
    { kind: "variant"; colour: Colour } | { kind: "upload"; source: string };
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  shortDescription?: string;
  tags: string[];
  lightShirtAsset: string;
  darkShirtAsset: string;
  thumbnail: string;
  artworkVariants?: {
    dark?: string;
    light?: string;
    original?: string;
    mode: "paired" | "original";
  };
  published?: boolean;
  available?: boolean;
  createdAt?: string;
  colours?: Colour[];
  sides?: Side[];
  sizes?: string[];
  featured?: boolean;
};
export type RequestRecord = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  description: string;
  colour: Colour;
  side: Side | "both";
  size: string;
  quantity: number;
  view?: View;
  designId?: string;
  variantId?: string;
  variantArtwork?: string;
  previewBackground?: Colour;
  uploadId?: string;
  uploadName?: string;
  createdAt: string;
  neededBy?: string;
  status: string;
  orderId?: string;
  designSnapshot?: { name: string; code: string; artwork: string };
  orderStatus?: string;
  available: boolean;
  notes: string;
  quote?: number;
  readyDate?: string;
  proposal?: string;
  checks?: string[];
  activity: { text: string; at: string }[];
};

export type RequestStatus =
  "New" | "Contacted" | "Converted to Order" | "Closed";
export type PaymentStatus = "Unpaid" | "Paid" | "Refunded";
export type ProductionStatus =
  "Confirmed" | "Printing" | "Ready" | "Delivered" | "Cancelled";
export type OrderInput = {
  name: string;
  phone: string;
  designId: string;
  colour: Colour;
  side: Side | "both";
  size: string;
  quantity: number;
  total: number;
  unitPrice?: number;
  notes?: string;
  neededBy?: string;
};
export type OrderRecord = OrderInput & {
  id: string;
  requestId?: string;
  createdAt: string;
  paymentStatus: PaymentStatus;
  productionStatus: ProductionStatus;
  everPaid: boolean;
  archived: boolean;
  snapshot: Readonly<{
    name: string;
    code: string;
    artwork: string;
    backArtwork?: string;
    colour: Colour;
    side: Side | "both";
    size: string;
    quantity: number;
    total: number;
    unitPrice?: number;
  }>;
  activity: { text: string; at: string }[];
};
