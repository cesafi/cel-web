'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronUp, ChevronDown, Trophy } from 'lucide-react';
import { moderniz } from '@/lib/fonts';

export interface StatsColumn<T = any> {
    key: string;
    label: string;
    tooltip?: string;
    width?: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    render?: (row: T, index: number) => React.ReactNode; // Custom renderer
    formatter?: (value: any, row: T) => React.ReactNode; // Value formatter (e.g. percentages)
    useHeatmap?: boolean; // Whether to apply heat map logic
    invertHeatmap?: boolean; // For stats where lower is better (deaths, losses)
}

interface GenericStatsTableProps<T> {
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
    data: T[];
    columns: StatsColumn<T>[];
    sortColumn?: string;
    sortOrder?: 'asc' | 'desc';
    onSort?: (column: string) => void;
    isLoading?: boolean;
    className?: string;
    
    // Identity column configuration
    renderRank?: boolean;
    stickyFirstColumn?: boolean;
}

export function GenericStatsTable<T extends Record<string, any>>({
    title,
    subtitle,
    icon,
    data,
    columns,
    sortColumn,
    sortOrder,
    onSort,
    isLoading = false,
    className,
    renderRank = true,
    stickyFirstColumn = false,
}: GenericStatsTableProps<T>) {

    // Calculate max values for heatmap
    const maxValues = useMemo(() => {
        const max: Record<string, number> = {};
        columns.filter(c => c.useHeatmap).forEach(col => {
            // Find max numeric value for this column
            const values = data.map(d => {
                const val = d[col.key];
                return typeof val === 'number' ? val : parseFloat(String(val)) || 0;
            });
            max[col.key] = Math.max(...values, 1); // Avoid div by zero
        });
        return max;
    }, [data, columns]);

    // Heatmap style generator
    const getHeatmapStyle = (value: any, col: StatsColumn<T>) => {
        if (!col.useHeatmap) return {};
        
        const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0;
        const max = maxValues[col.key] || 1;
        
        // Normalize 0-1
        let ratio = numValue / max;
        if (ratio < 0) ratio = 0;
        if (ratio > 1) ratio = 1;

        if (col.invertHeatmap) {
            // Logic for deaths/losses: High ratio = bad (Red)
            if (ratio > 0.8) return { backgroundColor: 'rgba(239, 68, 68, 0.15)' }; // Strong Red
            if (ratio > 0.5) return { backgroundColor: 'rgba(239, 68, 68, 0.08)' }; // Weak Red
            return {};
        } else {
            // Logic for wins/kills: High ratio = good (Green/Blue)
            if (ratio >= 0.9) return { backgroundColor: 'rgba(16, 185, 129, 0.2)' }; // Green
            if (ratio >= 0.7) return { backgroundColor: 'rgba(59, 130, 246, 0.15)' }; // Blue
            if (ratio >= 0.5) return { backgroundColor: 'rgba(59, 130, 246, 0.05)' }; // Weak Blue
            return {};
        }
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortColumn !== column) return null;
        return sortOrder === 'asc' 
          ? <ChevronUp className="h-3 w-3 inline-block ml-1 opacity-70" />
          : <ChevronDown className="h-3 w-3 inline-block ml-1 opacity-70" />;
    };

    if (data.length === 0 && !isLoading) {
        return (
            <Card>
                <CardContent className="py-12 text-center">
                    <div className="text-muted-foreground">
                        No statistics available to display.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={cn('rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden', className)}>
            {/* Header */}
            {(title || subtitle) && (
                <div className="p-4 border-b border-border/30 flex items-center justify-between bg-muted/5">
                    <div className="flex items-center gap-3">
                        {icon && (
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                {icon}
                            </div>
                        )}
                        <div>
                            {title && <h3 className={cn(moderniz.className, "text-xl font-bold tracking-wide")}>{title}</h3>}
                            {subtitle && <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto relative min-h-[400px]">
                <table className="w-max min-w-full caption-bottom text-sm border-collapse">
                    <thead>
                        <tr className="bg-muted/30 border-b border-border/50 hover:bg-muted/30">
                            {renderRank && (
                                <th className={cn(
                                    "w-[50px] text-center text-xs uppercase font-bold tracking-wider text-muted-foreground/80 h-10 bg-background/95", // explicit bg for sticky
                                    stickyFirstColumn && "sticky left-0 z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.05)]"
                                )}>
                                    #
                                </th>
                            )}
                            
                            {columns.map((col, index) => {
                                const isSticky = stickyFirstColumn && index === 0;
                                return (
                                    <th
                                        key={col.key}
                                        className={cn(
                                            col.width, 
                                            "text-xs uppercase font-bold tracking-wider text-muted-foreground/80 h-10 px-4 bg-background/95", // Increased padding
                                            col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                                            col.sortable ? 'cursor-pointer hover:bg-muted/50 select-none' : '',
                                            isSticky && "sticky z-20 shadow-[1px_0_0_0_rgba(255,255,255,0.05)]",
                                            isSticky && (renderRank ? "left-[50px]" : "left-0")
                                        )}
                                        onClick={() => col.sortable && onSort?.(col.key)}
                                    >
                                        <div className={cn(
                                            "flex items-center gap-1 h-full",
                                            col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'
                                        )}>
                                            <TooltipProvider delayDuration={200}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className={cn(
                                                            "flex items-center gap-1",
                                                            col.tooltip && "cursor-help decoration-dotted underline-offset-4 hover:underline decoration-muted-foreground/50"
                                                        )}>
                                                            {col.label}
                                                            {col.sortable && <SortIcon column={col.key} />}
                                                        </span>
                                                    </TooltipTrigger>
                                                    {col.tooltip && (
                                                        <TooltipContent 
                                                            side="top" 
                                                            className="bg-popover text-popover-foreground text-xs font-medium px-3 py-1.5 border border-border/50 shadow-xl"
                                                        >
                                                            <p>{col.tooltip}</p>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => {
                            const rank = index + 1;
                            const isTop3 = rank <= 3;
                            
                            return (
                                <tr 
                                    key={index}
                                    className="group border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                                >
                                    {renderRank && (
                                        <td className={cn(
                                            "text-center py-2.5 px-1 bg-card/50 backdrop-blur-sm", // Keep rank compact
                                            stickyFirstColumn && "sticky left-0 z-10 shadow-[1px_0_0_0_rgba(255,255,255,0.05)]"
                                        )}>
                                            <div className={cn(
                                                "w-6 h-6 mx-auto flex items-center justify-center rounded-full text-[10px] font-bold border",
                                                rank === 1 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" :
                                                rank === 2 ? "bg-slate-400/20 text-slate-400 border-slate-400/50" :
                                                rank === 3 ? "bg-orange-700/20 text-orange-700 border-orange-700/50" :
                                                "bg-muted/50 text-muted-foreground border-transparent"
                                            )}>
                                                {rank}
                                            </div>
                                        </td>
                                    )}

                                    {columns.map((col, colIndex) => {
                                        const value = row[col.key];
                                        const heatmapStyle = getHeatmapStyle(value, col);
                                        const isSticky = stickyFirstColumn && colIndex === 0;

                                        return (
                                            <td 
                                                key={col.key}
                                                style={isSticky ? {} : heatmapStyle} // Don't apply heatmap bg to sticky column directly if possible, or handle carefully
                                                className={cn(
                                                    "py-3 px-4 text-sm tabular-nums text-foreground/80 transition-colors", // Increased vertical and horizontal padding
                                                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                                                    col.key === 'win_rate' || col.key === 'avg_kda' ? 'font-bold' : '',
                                                    isSticky && "sticky z-10 bg-card/95 backdrop-blur-sm shadow-[1px_0_0_0_rgba(255,255,255,0.05)]", // Explicit BG for sticky
                                                    isSticky && (renderRank ? "left-[50px]" : "left-0")
                                                )}
                                            >
                                                {col.render ? (
                                                    col.render(row, index)
                                                ) : col.formatter ? (
                                                    col.formatter(value, row)
                                                ) : (
                                                    value === undefined || value === null ? '-' : String(value)
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
