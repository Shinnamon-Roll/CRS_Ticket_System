import { useMemo, useState } from 'react';
import { Settings2, Users, MapPin, ClipboardList } from 'lucide-react';
import { useApp } from '../context/AppContext';

type SetupSectionKey = 'users' | 'location' | 'request-setup';

interface SetupSection {
  key: SetupSectionKey;
  title: string;
  icon: React.ReactNode;
  items: string[];
}

export default function AdminSetupPage() {
  const { language } = useApp();
  const [active, setActive] = useState<SetupSectionKey>('users');

  const sections = useMemo<SetupSection[]>(() => {
    const isTH = language === 'th';
    return [
      {
        key: 'users',
        title: isTH ? 'Users' : 'Users',
        icon: <Users className="w-4 h-4" />,
        items: [
          'users count',
          'user profile',
          'departments',
          'user group',
          'user analytic',
        ],
      },
      {
        key: 'location',
        title: isTH ? 'Location' : 'Location',
        icon: <MapPin className="w-4 h-4" />,
        items: [
          'locations',
          'location types',
          'floors',
          'location families',
          'buildings',
        ],
      },
      {
        key: 'request-setup',
        title: isTH ? 'Request Setup' : 'Request Setup',
        icon: <ClipboardList className="w-4 h-4" />,
        items: [
          'request families',
          'workflows',
          'predefined requests',
          'work families',
          'checklist',
          'task schedule setting',
        ],
      },
    ];
  }, [language]);

  const selectedSection = sections.find((s) => s.key === active) || sections[0];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-brown-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <Settings2 className="w-6 h-6 text-gold-500" />
          {language === 'th' ? 'Admin Setup' : 'Admin Setup'}
        </h2>
        <p className="text-sm text-brown-500 mt-1">
          {language === 'th' ? 'เมนูตั้งค่าระบบสำหรับผู้ดูแล' : 'Administrative setup menus'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <aside className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-brown-100 p-3 space-y-2">
          {sections.map((section) => {
            const isActive = section.key === active;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActive(section.key)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors inline-flex items-center gap-2 ${
                  isActive
                    ? 'bg-brown-700 text-cream-100'
                    : 'bg-cream-50 text-brown-700 hover:bg-cream-100'
                }`}
              >
                {section.icon}
                {section.title}
              </button>
            );
          })}
        </aside>

        <section className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-brown-100 p-5">
          <h3 className="text-lg font-bold text-brown-800 mb-4 flex items-center gap-2">
            {selectedSection.icon}
            <span>{selectedSection.title}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedSection.items.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-brown-100 bg-cream-50 px-4 py-3"
              >
                <p className="text-sm font-semibold text-brown-800 capitalize">{item}</p>
                <p className="text-xs text-brown-500 mt-1">
                  {language === 'th' ? 'เมนูย่อยสำหรับการตั้งค่า' : 'Sub-menu configuration'}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
