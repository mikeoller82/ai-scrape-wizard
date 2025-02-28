
import * as React from "react";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey: string;
    cell?: (info: { getValue: () => any; row: { original: T } }) => React.ReactNode;
  }[];
  className?: string;
}

export function DataTable<T>({ data, columns, className }: DataTableProps<T>) {
  if (!data.length) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="py-3 px-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={cn(
                  "border-t border-gray-200 dark:border-gray-700",
                  rowIndex % 2 === 0
                    ? "bg-white dark:bg-gray-950"
                    : "bg-gray-50 dark:bg-gray-900"
                )}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={`${rowIndex}-${colIndex}`}
                    className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300"
                  >
                    {column.cell
                      ? column.cell({
                          getValue: () => {
                            // @ts-ignore
                            return row[column.accessorKey];
                          },
                          row: { original: row },
                        })
                      : // @ts-ignore
                        row[column.accessorKey] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
