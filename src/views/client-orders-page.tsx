"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "FREE";
type DeliveryStatus = "PASS" | "FAIL" | "PENDING";

type OrderRecord = {
  order_id: string;
  business_name: string;
  email: string;
  created_at: string;
  plan: string;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  package_available: boolean;
};

type OrdersResponse = {
  status: string;
  llm_used: false;
  orders: OrderRecord[];
  error?: string;
};

function paymentBadgeVariant(status: PaymentStatus) {
  if (status === "PAID" || status === "FREE") return "default" as const;
  if (status === "PENDING") return "secondary" as const;
  if (status === "REFUNDED") return "outline" as const;
  return "destructive" as const;
}

function deliveryBadgeVariant(status: DeliveryStatus) {
  if (status === "PASS") return "default" as const;
  if (status === "PENDING") return "secondary" as const;
  return "destructive" as const;
}

function packageBadgeVariant(available: boolean) {
  return available ? ("default" as const) : ("outline" as const);
}

export function ClientOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        const response = await fetch("/api/client-orders");
        const data = (await response.json()) as OrdersResponse;
        if (!active) {
          return;
        }
        if (data.status !== "PASS") {
          throw new Error(data.error ?? "Failed to load orders");
        }
        setOrders(data.orders ?? []);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load orders");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOrders();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Orders</CardTitle>
          <CardDescription>
            Metadata-only order history. Deliverable files are temporary and not stored permanently.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {!loading && orders.length === 0 ? (
            <Alert>
              <AlertTitle>No Orders Yet</AlertTitle>
              <AlertDescription>
                Generate Client MVP from the questionnaire to create the first order record.
              </AlertDescription>
            </Alert>
          ) : null}

          <Separator />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead>Package Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10}>Loading orders...</TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.order_id}>
                    <TableCell className="font-mono text-xs">{order.order_id}</TableCell>
                    <TableCell>{order.business_name}</TableCell>
                    <TableCell>{order.email}</TableCell>
                    <TableCell>{order.created_at}</TableCell>
                    <TableCell>{order.plan}</TableCell>
                    <TableCell>{order.amount}</TableCell>
                    <TableCell>{order.currency}</TableCell>
                    <TableCell>
                      <Badge variant={paymentBadgeVariant(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={deliveryBadgeVariant(order.delivery_status)}>
                        {order.delivery_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={packageBadgeVariant(order.package_available)}>
                        {order.package_available ? "YES" : "NO"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Refresh Orders
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
