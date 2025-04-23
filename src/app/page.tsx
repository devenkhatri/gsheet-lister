"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SheetData, getSheetData } from "@/services/google-sheets";
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
import { useEffect } from "react";

function SheetItem({ row, columnNames }: { row: any; columnNames: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start rounded-none border-b py-4 hover:bg-secondary">
          {row[columnNames[0]] || "No Title"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{row[columnNames[0]] || "No Title"}</DialogTitle>
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
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSheetData(sheetId);
      setSheetData(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch data");
      console.error(e);
      setSheetData(null);
    } finally {
      setIsLoading(false);
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
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
            />
            <Button onClick={fetchData} disabled={isLoading}>
              {isLoading ? "Loading..." : "Fetch Data"}
            </Button>
          </div>

          {error && <div className="text-red-500">{error}</div>}

          {sheetData && (
            <>
              <Separator />
              <div className="text-lg font-medium">Data Listing</div>
              <ScrollArea className="rounded-md border">
                {sheetData.rows.map((row, index) => (
                  <SheetItem key={index} row={row} columnNames={sheetData.columnNames} />
                ))}
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
