import { useApp } from '../context/AppContext';
import { Wrench, CheckCircle2 } from 'lucide-react';

export default function MyTasksPage() {
  const { currentUser, getDepartmentTasks, assignTicket, language } = useApp();
  const departmentTasks = getDepartmentTasks();

  const unassigned = departmentTasks.filter((t) => !t.assignedTo);
  const accepted = departmentTasks.filter((t) => t.assignedTo);

  const stageLabel = (stage: string) => {
    if (language === 'en') {
      if (stage === 'request') return 'Request';
      if (stage === 'doing') return 'Doing';
      if (stage === 'review') return 'Review';
      if (stage === 'done') return 'Done';
      return stage;
    }
    if (stage === 'request') return 'แจ้งใหม่';
    if (stage === 'doing') return 'กำลังทำ';
    if (stage === 'review') return 'รอตรวจ';
    if (stage === 'done') return 'เสร็จแล้ว';
    return stage;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <Wrench className="w-6 h-6 text-gold-500" />
          {language === 'th' ? 'งานรับผิดชอบในแผนก' : 'Department Task Inbox'}
        </h2>
        <p className="text-sm text-brown-500 mt-1">
          {language === 'th'
            ? `งานในแผนก ${currentUser.department} ทั้งหมด ${departmentTasks.length} รายการ`
            : `${departmentTasks.length} tasks in ${currentUser.department}`}
        </p>
      </div>

      {unassigned.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-bold text-brown-600 uppercase tracking-wider mb-3">
            {language === 'th' ? `งานรอรับ (${unassigned.length})` : `Unassigned (${unassigned.length})`}
          </h3>
          <div className="space-y-3">
            {unassigned.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-brown-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-brown-500">{ticket.code}</p>
                    <p className="text-sm font-semibold text-brown-800 mt-0.5">{ticket.title}</p>
                    <p className="text-xs text-brown-500 mt-1">{ticket.description}</p>
                    <p className="text-xs text-brown-500 mt-1">
                      {language === 'th' ? 'สถานะ' : 'Stage'}: <span className="font-semibold text-brown-700">{stageLabel(ticket.stage)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => assignTicket(ticket.id, currentUser.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {language === 'th' ? 'Accept งานนี้' : 'Accept Task'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {accepted.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-brown-600 uppercase tracking-wider mb-3">
            {language === 'th' ? `งานที่มีผู้รับแล้ว (${accepted.length})` : `Assigned (${accepted.length})`}
          </h3>
          <div className="space-y-3">
            {accepted.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-brown-200 bg-white p-4">
                <p className="text-xs font-bold text-brown-500">{ticket.code}</p>
                <p className="text-sm font-semibold text-brown-800 mt-0.5">{ticket.title}</p>
                <p className="text-xs text-brown-500 mt-1">{ticket.description}</p>
                <div className="mt-2 text-xs text-brown-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>{language === 'th' ? 'สถานะ' : 'Stage'}: <b>{stageLabel(ticket.stage)}</b></span>
                  <span>{language === 'th' ? 'ผู้รับงาน' : 'Assignee'}: <b>{ticket.assignedToName || '-'}</b></span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {departmentTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-brown-300">
          <Wrench className="w-12 h-12 mb-3" />
          <p className="text-sm">{language === 'th' ? 'ยังไม่มีงานในแผนกนี้' : 'No tasks in this department yet'}</p>
        </div>
      )}
    </div>
  );
}
