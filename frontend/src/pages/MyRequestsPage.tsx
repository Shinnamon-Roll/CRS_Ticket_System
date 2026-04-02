import { useApp } from '../context/AppContext';
import {
  ClipboardList,
  Search,
  PlusCircle,
  FilterX,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Wrench,
  Circle,
  MoreHorizontal,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type StatusFilter = 'pending' | 'closed' | 'on-hold' | 'all';
type SortField = 'requestor' | 'location' | 'title' | 'status' | 'owner' | 'createdOn';
type SortDirection = 'asc' | 'desc';

export default function MyRequestsPage() {
  const { tickets, assignTicket, updateTicketStage, currentUser, language, openTicketChat } = useApp();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdOn');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const departmentTickets = useMemo(
    () => tickets.filter((t) => {
      if (currentUser.departmentId && t.departmentId) {
        return t.departmentId === currentUser.departmentId;
      }
      return t.department === currentUser.department;
    }),
    [tickets, currentUser.department, currentUser.departmentId]
  );

  const summary = useMemo(() => {
    const pending = departmentTickets.filter((t) => t.stage !== 'done').length;
    const doing = departmentTickets.filter((t) => t.stage === 'doing').length;
    const review = departmentTickets.filter((t) => t.stage === 'review').length;
    const closed = departmentTickets.filter((t) => t.stage === 'done').length;
    const accepted = departmentTickets.filter((t) => Boolean(t.assignedTo)).length;
    const total = departmentTickets.length;
    return { pending, doing, review, closed, accepted, total };
  }, [departmentTickets]);

  const filteredRows = useMemo(() => {
    const byStatus = departmentTickets.filter((t) => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'closed') return t.stage === 'done';
      if (statusFilter === 'on-hold') return t.stage === 'review';
      return t.stage !== 'done';
    });

    const q = search.trim().toLowerCase();
    const bySearch = q
      ? byStatus.filter((t) =>
          [
            t.code,
            t.title,
            t.description,
            t.location || '',
            t.reportedByName || '',
            t.assignedToName || '',
          ]
            .join(' ')
            .toLowerCase()
            .includes(q)
        )
      : byStatus;

    const sorted = [...bySearch].sort((a, b) => {
      const aAccepted = Boolean(a.assignedTo);
      const bAccepted = Boolean(b.assignedTo);

      let aValue = '';
      let bValue = '';

      if (sortField === 'requestor') {
        aValue = a.reportedByName || '';
        bValue = b.reportedByName || '';
      } else if (sortField === 'location') {
        aValue = a.location || '';
        bValue = b.location || '';
      } else if (sortField === 'title') {
        aValue = a.title || '';
        bValue = b.title || '';
      } else if (sortField === 'status') {
        aValue = statusLabel(a.stage, aAccepted);
        bValue = statusLabel(b.stage, bAccepted);
      } else if (sortField === 'owner') {
        aValue = a.assignedToName || '';
        bValue = b.assignedToName || '';
      } else {
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortDirection === 'asc' ? diff : -diff;
      }

      const compare = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? compare : -compare;
    });

    return sorted;
  }, [departmentTickets, search, sortDirection, sortField, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const page = Math.min(currentPage, totalPages);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  const pageStart = filteredRows.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const pageEnd = Math.min(page * rowsPerPage, filteredRows.length);

  const currentPageIds = pagedRows.map((row) => row.id);
  const allCurrentPageSelected = currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.includes(id));

  const statusBadgeClass = (stage: string, accepted: boolean) => {
    if (stage === 'done') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (stage === 'doing') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (stage === 'review') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (accepted) return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const statusLabel = (stage: string, accepted: boolean) => {
    if (stage === 'request' && accepted) return 'ACCEPTED';
    if (stage === 'request') return 'NEW';
    return stage.toUpperCase();
  };

  const rowIcon = (priority: string) => {
    if (priority === 'urgent') return <AlertTriangle className="w-3.5 h-3.5 text-red-600" />;
    if (priority === 'high') return <Wrench className="w-3.5 h-3.5 text-blue-600" />;
    return <Circle className="w-3.5 h-3.5 text-brown-400" />;
  };

  const toggleSort = (field: SortField) => {
    setCurrentPage(1);
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-brown-300" />;
    if (sortDirection === 'asc') return <ChevronUp className="w-3.5 h-3.5 text-blue-600" />;
    return <ChevronDown className="w-3.5 h-3.5 text-blue-600" />;
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <ClipboardList className="w-6 h-6 text-gold-500" />
          {language === 'th' ? 'สรุปงานของฉัน' : 'My Summary'}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Pending', value: summary.pending },
          { label: 'Doing', value: summary.doing },
          { label: 'On Hold', value: summary.review },
          { label: 'Accepted', value: summary.accepted },
          { label: 'Closed', value: summary.closed },
          { label: 'Total', value: summary.total },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-brown-200/60 bg-white px-4 py-3 text-center">
            <p className="text-3xl font-bold text-brown-800 leading-none">{card.value}</p>
            <p className="text-sm text-brown-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-brown-200/60 bg-white p-3">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <select className="rounded-lg border border-brown-200 bg-cream-50 px-2.5 py-1.5 text-xs text-brown-700">
            <option>{language === 'th' ? 'รีเควสทั้งหมด' : 'All Requests'}</option>
          </select>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-brown-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === 'th' ? 'ค้นหา...' : 'Search...'}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-brown-200 text-xs w-52"
              />
            </div>

            <button
              type="button"
              onClick={() => navigate('/new-request')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {language === 'th' ? 'New Request' : 'New Request'}
            </button>

            <div className="inline-flex rounded-lg border border-brown-200 overflow-hidden text-xs">
              {[
                { key: 'pending', label: 'Pending' },
                { key: 'closed', label: 'Closed' },
                { key: 'on-hold', label: 'On Hold' },
                { key: 'all', label: 'All' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatusFilter(opt.key as StatusFilter)}
                  className={`px-3 py-1.5 ${statusFilter === opt.key ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-white text-brown-600 hover:bg-cream-50'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter('pending');
                setSortField('createdOn');
                setSortDirection('desc');
                setRowsPerPage(10);
                setCurrentPage(1);
                setSelectedIds([]);
              }}
              className="inline-flex items-center gap-1 text-xs text-blue-700 hover:text-blue-800"
            >
              <FilterX className="w-3.5 h-3.5" />
              Clear Filters
            </button>
          </div>
        </div>

        <div className="overflow-auto max-h-[65vh]">
          <table className="min-w-[1050px] w-full text-sm">
            <thead>
              <tr className="border-b border-brown-100 text-left text-[12px] text-brown-600">
                <th className="sticky top-0 left-0 z-30 bg-white py-2.5 px-2 w-12">
                  <div className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={allCurrentPageSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageIds])));
                        } else {
                          setSelectedIds((prev) => prev.filter((id) => !currentPageIds.includes(id)));
                        }
                      }}
                      className="w-3.5 h-3.5"
                    />
                    <MoreHorizontal className="w-3.5 h-3.5 text-brown-400" />
                  </div>
                </th>
                <th className="sticky top-0 z-20 bg-white py-2.5 px-2">
                  <button type="button" onClick={() => toggleSort('requestor')} className="inline-flex items-center gap-1.5 hover:text-brown-800">
                    Requestor {sortIcon('requestor')}
                  </button>
                </th>
                <th className="sticky top-0 z-20 bg-white py-2.5 px-2">
                  <button type="button" onClick={() => toggleSort('location')} className="inline-flex items-center gap-1.5 hover:text-brown-800">
                    Location {sortIcon('location')}
                  </button>
                </th>
                <th className="sticky top-0 z-20 bg-white py-2.5 px-2">
                  <button type="button" onClick={() => toggleSort('title')} className="inline-flex items-center gap-1.5 hover:text-brown-800">
                    Title {sortIcon('title')}
                  </button>
                </th>
                <th className="sticky top-0 z-20 bg-white py-2.5 px-2">Description</th>
                <th className="sticky top-0 z-20 bg-white py-2.5 px-2">
                  <button type="button" onClick={() => toggleSort('status')} className="inline-flex items-center gap-1.5 hover:text-brown-800">
                    Status {sortIcon('status')}
                  </button>
                </th>
                <th className="sticky top-0 z-20 bg-white py-2.5 px-2">
                  <button type="button" onClick={() => toggleSort('owner')} className="inline-flex items-center gap-1.5 hover:text-brown-800">
                    Owner {sortIcon('owner')}
                  </button>
                </th>
                <th className="sticky top-0 z-20 bg-white py-2.5 px-2">
                  <button type="button" onClick={() => toggleSort('createdOn')} className="inline-flex items-center gap-1.5 hover:text-brown-800">
                    Created On {sortIcon('createdOn')}
                  </button>
                </th>
                <th className="sticky top-0 z-20 bg-white py-2.5 px-2">Due Date</th>
                <th className="sticky top-0 right-0 z-30 bg-white py-2.5 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((ticket) => {
                const accepted = Boolean(ticket.assignedTo);
                const selected = selectedIds.includes(ticket.id);
                return (
                  <tr key={ticket.id} className="border-b border-brown-100/70 align-top hover:bg-cream-50/50">
                    <td className="sticky left-0 z-10 bg-white py-2.5 px-2">
                      <div className="inline-flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, ticket.id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== ticket.id));
                            }
                          }}
                          className="w-3.5 h-3.5"
                        />
                        {rowIcon(ticket.priority)}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-[13px] text-brown-700">{ticket.reportedByName}</td>
                    <td className="py-2.5 px-2 font-semibold text-[13px] text-brown-700">{ticket.location || '-'}</td>
                    <td className="py-2.5 px-2 text-[13px] text-brown-700 max-w-[220px]">{ticket.title}</td>
                    <td className="py-2.5 px-2 text-[13px] text-brown-600 max-w-[260px] line-clamp-2">{ticket.description}</td>
                    <td className="py-2.5 px-2">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold ${statusBadgeClass(ticket.stage, accepted)}`}>
                        {statusLabel(ticket.stage, accepted)}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-[13px] text-brown-700">{ticket.assignedToName || '-'}</td>
                    <td className="py-2.5 px-2 text-[12px] text-brown-600">
                      {new Date(ticket.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-2 text-[13px] text-brown-500">-</td>
                    <td className="sticky right-0 z-10 bg-white py-2.5 px-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            if (accepted) return;
                            void assignTicket(ticket.id, currentUser.id);
                          }}
                          disabled={accepted}
                          className="px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 text-[11px] font-semibold disabled:opacity-40 shadow-sm"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => openTicketChat(ticket.id)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-blue-700 text-[11px] font-semibold shadow-sm"
                        >
                          Assign
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (ticket.stage === 'done') return;
                            if (!accepted) return;
                            void updateTicketStage(ticket.id, 'done');
                          }}
                          className="px-2.5 py-1 rounded-md bg-slate-100 text-blue-700 text-[11px] font-semibold shadow-sm"
                        >
                          Close
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredRows.length === 0 && (
            <div className="py-10 text-center text-sm text-brown-400">
              {language === 'th' ? 'ไม่พบรายการตามเงื่อนไขที่เลือก' : 'No requests found for current filters'}
            </div>
          )}
        </div>

        {filteredRows.length > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-brown-600">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2 py-1 rounded border border-brown-200 disabled:opacity-40"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-brown-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span>
                {pageStart}-{pageEnd} of {filteredRows.length}
              </span>

              <div className="flex items-center gap-2">
              <span>Rows</span>
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-brown-200 px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

