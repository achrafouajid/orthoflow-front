import { Patient } from './patient.model';

// ─── Category & Unit ────────────────────────────────────────────────────────

export type StockCategory =
  | 'BRACKETS'
  | 'WIRES'
  | 'ELASTICS'
  | 'INSTRUMENTS'
  | 'CONSUMABLES'
  | 'HYGIENE'
  | 'OTHER';

export type UnitOfMeasure = 'UNIT' | 'BOX' | 'BOTTLE' | 'PACK' | 'ML' | 'MG' | 'ROLL' | 'PAIR';

// ─── Supplier ───────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
}

// ─── Inventory Item (BR04) ───────────────────────────────────────────────────

export interface StockItem {
  id: string;
  /** Item Code */
  sku: string;
  /** Description */
  name: string;
  category: StockCategory;
  /** Unit of Measure (BR04) */
  unitOfMeasure?: UnitOfMeasure;
  supplier?: Supplier;
  /** Current Quantity */
  currentStock: number;
  /** Minimum Stock */
  minimumStock: number;
  /** Reorder Quantity (BR04) */
  reorderQuantity?: number;
  /** Vendor invoice–derived purchase price per pack */
  purchasePrice: number;
  /** Pack/unit size used to split bulk price */
  unitSize: number;
  /** Computed: purchasePrice / unitSize → 4dp (BR07 cost logic) */
  pricePerUse: number;
  /** Weighted Average Cost — updated on each vendor invoice (BR07 / Technical) */
  averageCost?: number;
  expiryDate?: string;
  batchNumber?: string;
  location?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Purchase Order (BR01) ──────────────────────────────────────────────────

/** Extended to include CONFIRMED, INVOICED, CLOSED per BR01 */
export type POStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'SENT'
  | 'PARTIAL'
  | 'RECEIVED'
  | 'INVOICED'
  | 'CLOSED'
  | 'CANCELLED';

export interface PurchaseOrderLine {
  id?: string;
  stockItem: StockItem;
  quantityOrdered: number;
  quantityReceived?: number;
  /** Unit price excluding tax */
  unitPrice: number;
  /** Tax rate % (BR01) */
  taxRate?: number;
  /** Computed: unitPrice * qty * (1 + taxRate/100) */
  totalPrice?: number;
}

export interface PurchaseOrder {
  id?: string;
  poNumber?: string;
  supplier: Supplier;
  status?: POStatus;
  lines: PurchaseOrderLine[];
  totalAmount?: number;
  totalTax?: number;
  orderDate?: string;
  /** Expected Delivery Date (BR01) */
  expectedDeliveryDate?: string;
  notes?: string;
}

// ─── Delivery Note / GRNI (BR02) ────────────────────────────────────────────

export type DNStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';

export interface DeliveryNoteLine {
  id?: string;
  poLine: PurchaseOrderLine;
  stockItem: StockItem;
  quantityExpected: number;
  quantityReceived: number;
  unitCost?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface DeliveryNote {
  id?: string;
  dnNumber?: string;
  purchaseOrder: PurchaseOrder;
  supplier?: Supplier;
  receivedDate?: string;
  receivedBy?: string;
  status?: DNStatus;
  lines: DeliveryNoteLine[];
  /** Amount Pending Invoice — GRNI balance (BR02) */
  amountPendingInvoice?: number;
  /** Whether this GRNI has been cleared by a vendor invoice (BR03) */
  vendorInvoiced?: boolean;
  stockMovementsGenerated?: boolean;
  notes?: string;
}

// ─── Vendor Invoice (BR03) ──────────────────────────────────────────────────

export type VendorInvoiceStatus = 'DRAFT' | 'VALIDATED' | 'CANCELLED';

export interface VendorInvoiceLine {
  id?: string;
  stockItem: StockItem;
  quantityInvoiced: number;
  unitPrice: number;
  taxRate?: number;
  lineTotal?: number;
}

export interface VendorInvoice {
  id?: string;
  /** Vendor Invoice Number — mandatory (BR03) */
  vendorInvoiceNumber: string;
  deliveryNote: DeliveryNote;
  supplier?: Supplier;
  status?: VendorInvoiceStatus;
  /** Invoice Date (BR03) */
  invoiceDate: string;
  /** Invoice Amount (BR03) */
  invoiceAmount: number;
  lines?: VendorInvoiceLine[];
  /** Payment Terms (BR03) */
  paymentTerms?: string;
  notes?: string;
  createdAt?: string;
  validatedAt?: string;
}

// ─── Sales Order ────────────────────────────────────────────────────────────

export type SOStatus = 'DRAFT' | 'CONFIRMED' | 'INVOICED' | 'CANCELLED';

export interface SalesOrderLine {
  id?: string;
  stockItem: StockItem;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

export interface SalesOrder {
  id?: string;
  soNumber?: string;
  patient: Patient;
  status?: SOStatus;
  lines: SalesOrderLine[];
  totalAmount?: number;
  notes?: string;
  createdAt?: string;
}

// ─── Treatment & Consumption (BR05) ─────────────────────────────────────────

export interface TreatmentConsumable {
  stockItem: StockItem;
  /** Fixed quantity consumed per session */
  quantityUsed: number;
  /** Percentage of the item consumed (BR05) — e.g. 10 = 10% */
  consumptionPercentage?: number;
  /** Whether this is percentage-based (true) or fixed-unit (false) */
  isPercentage?: boolean;
}

export interface Treatment {
  id?: string;
  code: string;
  name: string;
  basePrice: number;
  consumables?: TreatmentConsumable[];
  createdAt?: string;
}

// ─── Treatment Invoice (BR07) ────────────────────────────────────────────────

export type TreatmentInvoiceStatus = 'DRAFT' | 'FINALIZED' | 'CANCELLED' | 'REFUNDED';
export type DiscountType = 'PERCENTAGE' | 'FIXED';
export type DiscountTarget = 'INVOICE' | 'ITEM' | 'TREATMENT';

export interface InvoiceDiscount {
  id?: string;
  type: DiscountType;
  target: DiscountTarget;
  targetId?: string;
  value: number;
  reason?: string;
}

export interface TreatmentInvoiceConsumable {
  id?: string;
  stockItem: StockItem;
  defaultQuantity: number;
  actualQuantity: number;
  /** Snapshotted from averageCost at session time (BR07) */
  pricePerUnit: number;
  totalCost: number;
  modified?: boolean;
}

export interface TreatmentInvoice {
  id?: string;
  invoiceNumber?: string;
  patient: Patient;
  treatment: Treatment;
  sessionDate?: string;
  status?: TreatmentInvoiceStatus;
  consumablesUsed?: TreatmentInvoiceConsumable[];
  discounts?: InvoiceDiscount[];
  treatmentPrice: number;
  consumablesCost?: number;
  /** Total material cost for analytics (BR07) */
  materialCost?: number;
  /** Gross margin = treatmentPrice − materialCost (BR07) */
  margin?: number;
  subtotal?: number;
  discountAmount?: number;
  total?: number;
  stockMovementsGenerated?: boolean;
  notes?: string;
  /** Doctor/clinician who performed the session (BR05 traceability) */
  performedBy?: string;
  createdBy?: string;
  createdAt?: string;
  finalizedAt?: string;
}

// ─── Inventory Movements Ledger (BR06) ───────────────────────────────────────

export type MovementType =
  | 'IN'
  | 'OUT'
  | 'ADJUSTMENT'
  | 'RETURN'
  | 'WRITE_OFF'
  | 'PURCHASE_RECEIPT'
  | 'VENDOR_INVOICE_ADJUSTMENT'
  | 'TREATMENT_CONSUMPTION'
  | 'INVENTORY_COUNT_ADJUSTMENT';

export type SourceType =
  | 'DELIVERY_NOTE'
  | 'VENDOR_INVOICE'
  | 'TREATMENT_INVOICE'
  | 'SALES_ORDER'
  | 'MANUAL_ADJUSTMENT'
  | 'INVENTORY_COUNT';

export interface StockMovement {
  /** Movement ID (BR06) */
  id: string;
  /** Item (BR06) */
  stockItem: StockItem;
  movementType: MovementType;
  /** Quantity (BR06) */
  quantity: number;
  /** Unit Cost at time of movement (BR06) */
  unitCost?: number;
  /** Total Cost = quantity × unitCost (BR06) */
  totalCost?: number;
  quantityBefore: number;
  quantityAfter: number;
  /** Source Module (BR06) */
  sourceType: SourceType;
  /** Related Document reference (BR06) */
  sourceId: string;
  sourceReference: string;
  /** Patient traceability (BR05) */
  patientId?: string;
  /** Doctor traceability (BR05) */
  doctorId?: string;
  notes?: string;
  /** User (BR06) */
  createdBy: string;
  /** Timestamp (BR06) */
  createdAt: string;
}

// ─── Physical Count Session (BR08) ──────────────────────────────────────────

export type CountSessionStatus = 'OPEN' | 'IN_PROGRESS' | 'VALIDATED' | 'CANCELLED';

export interface CountSessionLine {
  id?: string;
  stockItem: StockItem;
  /** Frozen theoretical quantity at session start (BR08) */
  theoreticalQuantity: number;
  /** Entered physical count (BR08) */
  physicalQuantity?: number;
  /** Quantity Variance = physical − theoretical (BR08) */
  quantityVariance?: number;
  /** Cost Variance = quantityVariance × averageCost (BR08) */
  costVariance?: number;
  notes?: string;
}

export interface CountSession {
  id?: string;
  sessionNumber?: string;
  status?: CountSessionStatus;
  /** Snapshot date — when the freeze happened (BR08) */
  snapshotDate?: string;
  countDate?: string;
  validatedDate?: string;
  lines?: CountSessionLine[];
  totalQuantityVariance?: number;
  totalCostVariance?: number;
  notes?: string;
  createdBy?: string;
  validatedBy?: string;
  createdAt?: string;
}

// ─── Analytics / KPI helpers (BR07, BR09) ───────────────────────────────────

export interface TreatmentProfitability {
  treatmentId: string;
  treatmentName: string;
  totalRevenue: number;
  totalMaterialCost: number;
  grossMargin: number;
  marginPercent: number;
  sessionCount: number;
}

export interface InventoryKPI {
  currentInventoryValue: number;
  lowStockItemCount: number;
  outOfStockItemCount: number;
  expiringItemCount: number;
  monthlyInventoryCost: number;
  inventoryVariancePercent: number;
  inventoryLossGainValue: number;
  topConsumedItems: TopConsumedItem[];
}

export interface TopConsumedItem {
  stockItemId: string;
  stockItemName: string;
  totalConsumed: number;
  totalCost: number;
}
