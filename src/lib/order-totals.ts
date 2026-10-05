import type { Order } from "./types";

export function orderExtraAmount(order: Pick<Order, "extraAmount">) {
  const value = Number(order.extraAmount) || 0;
  return value > 0 ? value : 0;
}

export function orderGrandTotal(
  order: Pick<Order, "totalPrice" | "extraAmount">
) {
  return (Number(order.totalPrice) || 0) + orderExtraAmount(order);
}
