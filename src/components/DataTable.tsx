import { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  ChevronsLeft,
  ChevronsRight,
  X,
} from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  pageSizeOptions?: number[];
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  title?: string;
  rowKey?: keyof T | ((row: T) => string);
  emptyText?: string;
}

type SortOrder = 'asc' | 'desc' | null;

function DefaultEmpty<T>() {
  return (
    <div className="py-16 text-center text-oil-text-muted">
      <div className="text-4xl mb-2 opacity-30">📋</div>
      <p>暂无数据</p>
    </div>
  );
}

export default function DataTable<T>({
  columns,
  data,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  showSearch = true,
  searchPlaceholder = '搜索...',
  searchKeys,
  title,
  rowKey,
  emptyText,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [searchText, setSearchText] = useState('');
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  const getRowKey = (row: T, index: number): string => {
    if (!rowKey) return String(index);
    if (typeof rowKey === 'function') return rowKey(row);
    return String(row[rowKey] ?? index);
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    if (showSearch && searchText.trim()) {
      const keyword = searchText.trim().toLowerCase();
      const keys = searchKeys || (columns.map((c) => c.key as keyof T));
      result = result.filter((row) =>
        keys.some((key) => {
          const value = row[key];
          return value != null && String(value).toLowerCase().includes(keyword);
        })
      );
    }

    if (sortKey && sortOrder) {
      result.sort((a, b) => {
        const aVal = a[sortKey as keyof T];
        const bVal = b[sortKey as keyof T];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const aStr = String(aVal);
        const bStr = String(bVal);
        return sortOrder === 'asc' ? aStr.localeCompare(bStr, 'zh-CN') : bStr.localeCompare(aStr, 'zh-CN');
      });
    }

    return result;
  }, [data, searchText, sortKey, sortOrder, columns, searchKeys, showSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / currentPageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * currentPageSize;
  const pageData = filteredData.slice(startIndex, startIndex + currentPageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') {
        setSortKey(null);
        setSortOrder(null);
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderPagination = () => {
    const pages: (number | '...')[] = [];
    const maxButtons = 5;
    let start = Math.max(1, safePage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (start > 2) pages.unshift('...');
    if (start > 1) pages.unshift(1);
    if (end < totalPages - 1) pages.push('...');
    if (end < totalPages) pages.push(totalPages);

    return pages;
  };

  return (
    <div className="bg-oil-panel rounded-xl border border-oil-accent/20 overflow-hidden">
      {(title || showSearch) && (
        <div className="px-5 py-4 border-b border-oil-accent/20 flex flex-wrap items-center justify-between gap-4">
          {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
          {showSearch && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-oil-text-muted" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-64 pl-9 pr-9 py-2 bg-oil-panel-light border border-oil-accent/30 rounded-lg text-sm text-white placeholder:text-oil-text-muted focus:outline-none focus:border-oil-accent focus:shadow-glow-blue transition-all"
              />
              {searchText && (
                <button
                  onClick={() => {
                    setSearchText('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-oil-text-muted hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-oil-panel-light/50">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width, textAlign: col.align || 'left' }}
                  className={`px-4 py-3 text-xs font-semibold text-oil-text-muted uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer select-none hover:text-white' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <div className={`inline-flex items-center gap-1 ${col.align === 'center' ? 'justify-center w-full' : col.align === 'right' ? 'justify-end w-full' : ''}`}>
                    {col.title}
                    {col.sortable && sortKey === String(col.key) && (
                      <span className="text-oil-accent">
                        {sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-oil-accent/10">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  {emptyText ? (
                    <div className="py-16 text-center text-oil-text-muted">{emptyText}</div>
                  ) : (
                    <DefaultEmpty />
                  )}
                </td>
              </tr>
            ) : (
                pageData.map((row, rowIndex) => (
                  <tr
                    key={getRowKey(row, startIndex + rowIndex)}
                    className="hover:bg-oil-panel-light/30 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        style={{ textAlign: col.align || 'left' }}
                        className="px-4 py-3 text-sm text-oil-text"
                      >
                        {col.render
                          ? col.render(row, startIndex + rowIndex)
                          : String(row[col.key as keyof T] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-4 border-t border-oil-accent/20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-oil-text-muted">
          <span>
            共 <span className="text-white font-medium">{filteredData.length}</span> 条
          </span>
          <span className="opacity-50">|</span>
          <div className="flex items-center gap-2">
            <span>每页</span>
            <select
              value={currentPageSize}
              onChange={(e) => {
                setCurrentPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-oil-panel-light border border-oil-accent/30 rounded px-2 py-1 text-sm text-oil-text focus:outline-none focus:border-oil-accent"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>条</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(1)}
            disabled={safePage === 1}
            className="w-8 h-8 flex items-center justify-center rounded border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => goToPage(safePage - 1)}
            disabled={safePage === 1}
            className="w-8 h-8 flex items-center justify-center rounded border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>

          {renderPagination().map((page, idx) =>
            page === '...' ? (
              <span key={`dot-${idx}`} className="w-8 h-8 flex items-center justify-center text-oil-text-muted">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-all ${
                  safePage === page
                    ? 'bg-oil-accent text-white shadow-glow-blue'
                    : 'border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent'
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() => goToPage(safePage + 1)}
            disabled={safePage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={safePage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded border border-oil-accent/30 text-oil-text-muted hover:text-white hover:border-oil-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
