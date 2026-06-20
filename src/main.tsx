import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import './styles.css';

type PeriodKey = 'week' | 'month' | 'quarter' | 'halfYear' | 'year';

type SectorRow = {
  symbol: string;
  week: number;
  month: number;
  quarter: number;
  halfYear: number;
  year: number;
};

type Snapshot = {
  date: string;
  file: string;
  rows: SectorRow[];
};

type SortState = {
  key: keyof SectorRow;
  direction: 'asc' | 'desc';
};

const periods: Array<{ key: PeriodKey; label: string; csv: string }> = [
  { key: 'week', label: '1 Week', csv: '1 wk' },
  { key: 'month', label: '1 Month', csv: '1 mo' },
  { key: 'quarter', label: '3 Months', csv: '3 mo' },
  { key: 'halfYear', label: '6 Months', csv: '6 mo' },
  { key: 'year', label: '1 Year', csv: '1 yr' },
];

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

const parseDateFromFile = (file: string) => {
  const match = file.match(/sector_perf_(\d{4}-\d{2}-\d{2})\.csv$/);
  return match?.[1] ?? '';
};

const formatDate = (date: string) => dateFormatter.format(new Date(`${date}T00:00:00Z`));

const parseCsv = (text: string): SectorRow[] => {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((header) => header.trim());

  return lines
    .filter(Boolean)
    .map((line) => {
      const cells = line.split(',').map((cell) => cell.trim());
      const valueFor = (name: string) => Number(cells[headers.indexOf(name)]);

      return {
        symbol: cells[headers.indexOf('symbol')],
        week: valueFor('1 wk'),
        month: valueFor('1 mo'),
        quarter: valueFor('3 mo'),
        halfYear: valueFor('6 mo'),
        year: valueFor('1 yr'),
      };
    });
};

const formatPercent = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const valueClass = (value: number) => {
  if (value < 0) return 'negative';
  if (value > 0.2) return 'strong';
  return 'positive';
};

function App() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'week', direction: 'desc' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/sector_perf_index.json')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load the sector performance file index.');
        return response.json() as Promise<string[]>;
      })
      .then((files) =>
        Promise.all(
          files.map((file) =>
            fetch(`/data/${file}`).then((response) => {
              if (!response.ok) throw new Error(`Unable to load ${file}.`);
              return response.text().then((csv) => ({
                date: parseDateFromFile(file),
                file,
                rows: parseCsv(csv),
              }));
            }),
          ),
        ),
      )
      .then((loadedSnapshots) => {
        const datedSnapshots = loadedSnapshots
          .filter((snapshot) => snapshot.date)
          .sort((a, b) => b.date.localeCompare(a.date));

        setSnapshots(datedSnapshots);
        setSelectedDate(datedSnapshots[0]?.date ?? '');
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.date === selectedDate) ?? snapshots[0],
    [selectedDate, snapshots],
  );

  const selectedIndex = useMemo(
    () => snapshots.findIndex((snapshot) => snapshot.date === selectedSnapshot?.date),
    [selectedSnapshot, snapshots],
  );

  const filteredRows = useMemo(() => {
    return [...(selectedSnapshot?.rows ?? [])]
      .filter((row) => row.symbol.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => {
        const aValue = a[sort.key];
        const bValue = b[sort.key];
        const modifier = sort.direction === 'asc' ? 1 : -1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * modifier;
        }

        return ((aValue as number) - (bValue as number)) * modifier;
      });
  }, [query, selectedSnapshot, sort]);

  const stats = useMemo(() => {
    const rows = selectedSnapshot?.rows ?? [];
    if (rows.length === 0) return null;
    const leader = rows.reduce((best, row) => (row.week > best.week ? row : best), rows[0]);
    const laggard = rows.reduce((worst, row) => (row.week < worst.week ? row : worst), rows[0]);
    const breadth = rows.filter((row) => row.week > 0).length;

    return { leader, laggard, breadth };
  }, [selectedSnapshot]);

  const updateSort = (key: keyof SectorRow) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const moveWeek = (offset: number) => {
    const nextSnapshot = snapshots[selectedIndex + offset];
    if (nextSnapshot) setSelectedDate(nextSnapshot.date);
  };

  const renderSortIcon = (key: keyof SectorRow) => {
    if (sort.key !== key) {
      return <ArrowDownUp aria-hidden="true" size={15} className="sort-icon inactive" />;
    }
    return sort.direction === 'asc' ? (
      <ArrowUp aria-hidden="true" size={15} className="sort-icon active" />
    ) : (
      <ArrowDown aria-hidden="true" size={15} className="sort-icon active" />
    );
  };

  return (
    <main className="page-shell">
      <section className="masthead" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Market dashboard</p>
          <h1 id="page-title">Sector Performance</h1>
          <p className="lede">
            Weekly sector snapshots with horizon rankings and short-term momentum by report date.
          </p>
        </div>
        <div className="as-of">
          <CalendarDays aria-hidden="true" size={18} />
          <span>{selectedSnapshot ? `As of ${formatDate(selectedSnapshot.date)}` : 'Loading'}</span>
        </div>
      </section>

      <section className="controls-panel" aria-label="Dashboard controls">
        <div className="week-nav" aria-label="Navigate weekly snapshots">
          <button
            type="button"
            onClick={() => moveWeek(1)}
            disabled={selectedIndex < 0 || selectedIndex >= snapshots.length - 1}
          >
            <ChevronLeft aria-hidden="true" size={17} />
            Prev
          </button>
          <span>{selectedSnapshot ? formatDate(selectedSnapshot.date) : 'Loading'}</span>
          <button type="button" onClick={() => moveWeek(-1)} disabled={selectedIndex <= 0}>
            Next
            <ChevronRight aria-hidden="true" size={17} />
          </button>
        </div>

        <label className="search-box">
          <Search aria-hidden="true" size={17} />
          <span className="sr-only">Filter symbols</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter symbol"
            type="search"
          />
        </label>
      </section>

      {stats && selectedSnapshot && (
        <section className="summary-grid" aria-label="Weekly market summary">
          <article>
            <span>1W leader</span>
            <strong>{stats.leader.symbol}</strong>
            <em className={valueClass(stats.leader.week)}>{formatPercent(stats.leader.week)}</em>
          </article>
          <article>
            <span>Positive breadth</span>
            <strong>
              {stats.breadth}/{selectedSnapshot.rows.length}
            </strong>
            <em>{Math.round((stats.breadth / selectedSnapshot.rows.length) * 100)}% above zero</em>
          </article>
          <article>
            <span>1W laggard</span>
            <strong>{stats.laggard.symbol}</strong>
            <em className={valueClass(stats.laggard.week)}>{formatPercent(stats.laggard.week)}</em>
          </article>
        </section>
      )}

      <section className="table-panel" aria-labelledby="table-title">
        <div className="table-toolbar">
          <div>
            <p className="eyebrow">Selected snapshot</p>
            <h2 id="table-title">ETF returns by horizon</h2>
          </div>
        </div>

        {error ? (
          <p className="status-message" role="alert">
            {error}
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <caption>Sector performance returns expressed as percentages.</caption>
              <thead>
                <tr>
                  <th scope="col" aria-sort={sort.key === 'symbol' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" onClick={() => updateSort('symbol')}>
                      Symbol {renderSortIcon('symbol')}
                    </button>
                  </th>
                  {periods.map((period) => (
                    <th key={period.key} scope="col" aria-sort={sort.key === period.key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button type="button" onClick={() => updateSort(period.key)}>
                        {period.label} {renderSortIcon(period.key)}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.symbol}>
                    <th scope="row">{row.symbol}</th>
                    {periods.map((period) => (
                      <td key={period.key} className={valueClass(row[period.key])}>
                        <span>
                          {row[period.key] >= 0 ? (
                            <TrendingUp aria-hidden="true" size={14} />
                          ) : (
                            <TrendingDown aria-hidden="true" size={14} />
                          )}
                          {formatPercent(row[period.key])}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
