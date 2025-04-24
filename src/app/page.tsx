"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SheetData, getSheetData, appendSheetData } from "@/services/google-sheets";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SheetRow {
  [key: string]: string;
}

function SheetItem({ row, columnNames }: { row: SheetRow; columnNames: string[] }) {
  const [open, setOpen] = useState(false);

  // Determine title
  let title = row["title"] || row[columnNames[0]] || "No Title";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start rounded-none border-b py-4 hover:bg-secondary">
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Full details from the Google Sheet.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[300px] w-full">
          <div className="grid gap-4">
            {columnNames.map((columnName) => (
              <div key={columnName}>
                <div className="text-sm font-medium leading-none">{columnName}</div>
                <p className="text-sm text-muted-foreground">{row[columnName] || "N/A"}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default function Home() {
  const [sheetId, setSheetId] = useState("");
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newRowData, setNewRowData] = useState<{ [key: string]: any }>({});
    const { toast } = useToast();


  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSheetData();
      setSheetData(data);
            // Initialize newRowData with empty strings for each column
            const initialNewRowData: { [key: string]: any } = {};
            data.columnNames.forEach(columnName => {
                initialNewRowData[columnName] = "";
            });
            setNewRowData(initialNewRowData);
    } catch (e: any) {
      setError(e.message || "Failed to fetch data");
      console.error(e);
      setSheetData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = async () => {
        setIsAdding(true);
        setError(null);
        try {
            await appendSheetData(newRowData);
            toast({
                title: "Success",
                description: "Row added successfully.",
            });
            // Refresh data
            await fetchData();
        } catch (e: any) {
            setError(e.message || "Failed to add row");
            console.error(e);
             toast({
                variant: "destructive",
                title: "Error",
                description: e.message || "Failed to add row",
            });
        } finally {
            setIsAdding(false);
        }
    };

  // Load sheetId from localStorage on component mount
  useEffect(() => {
    const storedSheetId = localStorage.getItem('sheetId');
    if (storedSheetId) {
      setSheetId(storedSheetId);
    }
  }, []);

  // Save sheetId to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('sheetId', sheetId);
  }, [sheetId]);

    const columns = useMemo<ColumnDef<SheetRow>[]>(() => {
        if (!sheetData) return [];

        return sheetData.columnNames.map(columnName => ({
            accessorKey: columnName,
            header: columnName,
            cell: ({ row }) => {
                const cellValue = row.getValue(columnName);
                return (
                  <div className="w-full">
                  {typeof cellValue === 'string' ? cellValue : String(cellValue)}
                  </div>
                )
            }
        }));
    }, [sheetData]);

    const data = useMemo(() => {
        return sheetData ? sheetData.rows : [];
    }, [sheetData]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Sheet Lister</CardTitle>
          <CardDescription>Connect to a Google Sheet and list its data.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Input
              type="text"
              placeholder="Google Sheet ID"
              value={sheetId || process.env.NEXT_PUBLIC_SHEET_ID}
              onChange={(e) => setSheetId(e.target.value)}
            />
            <Button onClick={fetchData} disabled={isLoading}>
              {isLoading ? "Load Data" : "Load Data"}
            </Button>
          </div>

          {error && <div className="text-red-500">{error}</div>}

          {sheetData && (
            <>
              <Separator />
              <div className="text-lg font-medium">Data Listing</div>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup, index) => (
                      <TableRow key={headerGroup.id + "-" + index}>
                        {headerGroup.headers.map((header, index) => {
                          return (
                            <TableHead key={`${header.id}-${index}`}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell, index) => (
                          <TableCell key={cell.id + "-" + index}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

              <Separator />

              <div className="text-lg font-medium">Add New Row</div>
              <div className="grid gap-2">
                {sheetData.columnNames.map((columnName, index) => {
                    // Generate a more robust unique ID
                    const uniqueId = `${columnName}-${index}`;
                    return (
                  <div key={uniqueId} className="grid gap-1.5">
                    <Label htmlFor={uniqueId}>{columnName}</Label>
                    <Textarea
                      id={uniqueId}
                      placeholder={columnName}
                      value={newRowData[columnName] || ""}
                      onChange={(e) =>
                        setNewRowData({
                          ...newRowData,
                          [columnName]: e.target.value,
                        })
                      }
                    />
                  </div>
                )})}
                <Button onClick={handleAddRow} disabled={isAdding}>
                  {isAdding ? "Adding..." : "Add Row"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
