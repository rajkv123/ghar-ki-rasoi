import type { OrderStatus } from "@/lib/kitchen/types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Awaiting UPI",
  paid: "Paid · in kitchen",
  preparing: "Cooking",
  out_for_delivery: "On the ride",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const KITCHEN_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  paid: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
};

export const KITCHEN_NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  paid: "Start cooking",
  preparing: "Hand to rider",
  out_for_delivery: "Mark delivered",
};
