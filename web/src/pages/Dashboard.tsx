import type { Column } from "../Types";
import { useLanguage } from "../i18n/useLanguage";
import DataStorageIndicator from "../components/DataStorageIndicator";

type Props = {
  columns: Column[];
};

export default function Dashboard({ columns }: Props) {
  const { t, language } = useLanguage();
  const allCards = columns.flatMap((c) => c.cards);
  const totalCards = allCards.length;

  const countsByColumn = columns.map((c) => ({
    id: c.id,
    title: c.title,
    count: c.cards.length,
  }));

  const totalSubtasks = allCards.reduce((sum, card) => sum + card.subtasks.length, 0);
  const doneSubtasks = allCards.reduce(
    (sum, card) => sum + card.subtasks.filter((s) => s.done).length,
    0
  );
  const subtaskProgress =
    totalSubtasks === 0 ? 0 : Math.round((doneSubtasks / totalSubtasks) * 100);

  const priorityCounts = allCards.reduce(
    (acc, card) => {
      if (card.priority === "High") acc.High++;
      else if (card.priority === "Medium") acc.Medium++;
      else if (card.priority === "Low") acc.Low++;
      return acc;
    },
    { High: 0, Medium: 0, Low: 0 }
  );

  const attachmentsCount = allCards.reduce(
    (sum, card) => sum + card.attachments.length,
    0
  );

  const membersCount = allCards.reduce((map, card) => {
    card.members.forEach((m) => {
      map[m.name] = (map[m.name] || 0) + 1;
    });
    return map;
  }, {} as Record<string, number>);

  const labelsCount = allCards.reduce((map, card) => {
    card.labels.forEach((l) => {
      map[l.name] = (map[l.name] || 0) + 1;
    });
    return map;
  }, {} as Record<string, number>);

  const doneColumn = columns.find((c) => c.id === "done");
  const doneCards = doneColumn ? doneColumn.cards.length : 0;

  // Map default column ids to translated titles
  const getColTitle = (id: string, fallback: string) => {
    if (id === "todo") return t.todo;
    if (id === "in-progress") return t.inProgress;
    if (id === "done") return t.done;
    return fallback;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t.dashboard}</h1>
        <DataStorageIndicator />
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">{t.tasks}</div>
          <div className="text-2xl font-semibold">{totalCards}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">{t.completed}</div>
          <div className="text-2xl font-semibold">{doneCards}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">{t.attachments}</div>
          <div className="text-2xl font-semibold">{attachmentsCount}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">{t.progress}</div>
          <div className="text-2xl font-semibold">{subtaskProgress}%</div>
          <div className="text-xs text-gray-500">
            {doneSubtasks}/{totalSubtasks}
          </div>
        </div>
      </div>

      {/* By Column */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">{t.tasks}</h2>
        <div className="flex gap-4 flex-wrap">
          {countsByColumn.map((c) => (
            <div key={c.id} className="px-4 py-2 bg-gray-50 border rounded">
              <div className="text-sm text-gray-600">{getColTitle(c.id, c.title)}</div>
              <div className="text-xl font-semibold">{c.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Priorities */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">{t.priority}</h2>
        <div className="flex gap-4">
          <div className="px-4 py-2 rounded text-white bg-red-500">
            {t.high}: {priorityCounts.High}
          </div>
          <div className="px-4 py-2 rounded text-white bg-yellow-500">
            {t.medium}: {priorityCounts.Medium}
          </div>
          <div className="px-4 py-2 rounded text-white bg-green-500">
            {t.low}: {priorityCounts.Low}
          </div>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">{t.members}</h2>
        {Object.keys(membersCount).length === 0 ? (
          <div className="text-sm text-gray-500">{language === 'ar' ? 'لا يوجد أعضاء مخصصون للمهام' : 'No members assigned to tasks'}</div>
        ) : (
          <ul className="list-disc list-inside">
            {Object.entries(membersCount).map(([name, count]) => (
              <li key={name}>
                {name}: {count}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Labels */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">{t.labels}</h2>
        {Object.keys(labelsCount).length === 0 ? (
          <div className="text-sm text-gray-500">{language === 'ar' ? 'لا توجد تسميات' : 'No labels'}</div>
        ) : (
          <ul className="list-disc list-inside">
            {Object.entries(labelsCount).map(([name, count]) => (
              <li key={name}>
                {name}: {count}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
