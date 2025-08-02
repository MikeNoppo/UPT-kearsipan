"use client";

import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2 } from "lucide-react";

interface PurchaseRequest {
  id: string
  requestNumber: string
  itemName: string
  quantity: number
  unit: string
  reason: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "RECEIVED"
  notes?: string
  requestDate: string
  reviewDate?: string
  createdAt: string
  updatedAt: string
  requestedBy: {
    id: string
    name: string
    username: string
  }
  reviewedBy?: {
    id: string
    name: string
    username: string
  }
  item?: {
    id: string
    name: string
    category: string
    stock: number
  }
}

interface PurchaseRequestActionsProps {
  purchaseRequest: PurchaseRequest;
  onDelete: (purchaseRequest: PurchaseRequest) => void;
  currentUserId: string;
  currentUserRole: string;
}

export function PurchaseRequestActions({ 
  purchaseRequest, 
  onDelete, 
  currentUserId, 
  currentUserRole 
}: PurchaseRequestActionsProps) {
  // Check if user can delete this request
  const canDelete = 
    (currentUserRole === 'ADMIN' || currentUserId === purchaseRequest.requestedBy.id) &&
    ['PENDING', 'REJECTED', 'APPROVED'].includes(purchaseRequest.status);

  // If no actions available, don't render dropdown
  if (!canDelete) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Buka menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(purchaseRequest)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
