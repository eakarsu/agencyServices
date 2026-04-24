"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Download, FileText, Trash2, Edit, ChevronsUpDown } from "lucide-react";
import { TableSkeleton } from "./Skeleton";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  exportValue?: (item: T) => string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  // Sort
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string, direction: "asc" | "desc") => void;
  // Bulk select
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkUpdate?: (ids: string[], data: Record<string, string>) => void;
  bulkUpdateOptions?: { label: string; field: string; values: { label: string; value: string }[] }[];
  // Export
  exportFilename?: string;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  page,
  totalPages,
  onPageChange,
  onRowClick,
  loading,
  sortField,
  sortDirection,
  onSort,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  onBulkDelete,
  onBulkUpdate,
  bulkUpdateOptions = [],
  exportFilename = "export",
}: DataTableProps<T>) {
  const [bulkAction, setBulkAction] = useState("");
  const [bulkUpdateField, setBulkUpdateField] = useState("");
  const [bulkUpdateValue, setBulkUpdateValue] = useState("");

  if (loading) {
    return <TableSkeleton rows={5} columns={columns.length + (selectable ? 1 : 0)} />;
  }

  const allSelected = data.length > 0 && data.every((item) => selectedIds.includes(item.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !data.find((item) => item.id === id)));
    } else {
      const idSet = new Set([...selectedIds, ...data.map((item) => item.id)]);
      const newIds = Array.from(idSet);
      onSelectionChange(newIds);
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSort = (field: string) => {
    if (!onSort) return;
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    onSort(field, newDirection);
  };

  const exportCSV = () => {
    const headers = columns.map((c) => c.label);
    const rows = data.map((item) =>
      columns.map((col) => {
        if (col.exportValue) return col.exportValue(item);
        const val = (item as Record<string, unknown>)[col.key];
        return String(val ?? "");
      })
    );
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const headers = columns.map((c) => `<th style="border:1px solid #ddd;padding:8px;background:#f4f4f4;text-align:left;">${c.label}</th>`).join("");
    const rows = data
      .map(
        (item) =>
          `<tr>${columns
            .map((col) => {
              const val = col.exportValue ? col.exportValue(item) : String((item as Record<string, unknown>)[col.key] ?? "");
              return `<td style="border:1px solid #ddd;padding:8px;">${val}</td>`;
            })
            .join("")}</tr>`
      )
      .join("");
    printWindow.document.write(`
      <html><head><title>${exportFilename}</title></head>
      <body style="font-family:Arial,sans-serif;">
        <h1 style="color:#333;">${exportFilename}</h1>
        <p style="color:#666;">Generated on ${new Date().toLocaleDateString()}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:20px;">
          <thead><tr>${headers}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleBulkAction = () => {
    if (bulkAction === "delete" && onBulkDelete) {
      onBulkDelete(selectedIds);
    } else if (bulkAction === "update" && onBulkUpdate && bulkUpdateField && bulkUpdateValue) {
      onBulkUpdate(selectedIds, { [bulkUpdateField]: bulkUpdateValue });
    }
    setBulkAction("");
    setBulkUpdateField("");
    setBulkUpdateValue("");
  };

  return (
    <div>
      {/* Toolbar: Export + Bulk Actions */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {selectable && selectedIds.length > 0 && (
            <>
              <span className="text-sm text-gray-600">{selectedIds.length} selected</span>
              {onBulkDelete && (
                <button
                  onClick={() => onBulkDelete(selectedIds)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
              {bulkUpdateOptions.length > 0 && onBulkUpdate && (
                <div className="flex items-center gap-1">
                  <select
                    value={bulkUpdateField}
                    onChange={(e) => { setBulkUpdateField(e.target.value); setBulkUpdateValue(""); }}
                    className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
                  >
                    <option value="">Update field...</option>
                    {bulkUpdateOptions.map((opt) => (
                      <option key={opt.field} value={opt.field}>{opt.label}</option>
                    ))}
                  </select>
                  {bulkUpdateField && (
                    <>
                      <select
                        value={bulkUpdateValue}
                        onChange={(e) => setBulkUpdateValue(e.target.value)}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1.5"
                      >
                        <option value="">Select value...</option>
                        {bulkUpdateOptions.find((o) => o.field === bulkUpdateField)?.values.map((v) => (
                          <option key={v.value} value={v.value}>{v.label}</option>
                        ))}
                      </select>
                      {bulkUpdateValue && (
                        <button
                          onClick={handleBulkAction}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Apply
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100"
            title="Export PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-4 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable && onSort ? "cursor-pointer select-none hover:bg-gray-100" : ""
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && onSort && (
                      <span className="inline-flex flex-col">
                        {sortField === column.key ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5 text-primary-600" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-primary-600" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                  No data found
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className={`${onRowClick ? "cursor-pointer" : ""} ${
                    selectedIds.includes(item.id) ? "bg-primary-50" : "hover:bg-gray-50"
                  }`}
                >
                  {selectable && (
                    <td className="px-4 py-4 w-12" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleOne(item.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      onClick={() => onRowClick?.(item)}
                    >
                      {column.render
                        ? column.render(item)
                        : (item as Record<string, unknown>)[column.key] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
