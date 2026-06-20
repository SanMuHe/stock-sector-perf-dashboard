import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDownUp, CalendarDays, Search, TrendingDown, TrendingUp } from 'lucide-react';
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

type SortState = {
  key: keyof SectorRow;
  direction: 'asc' | 'desc';
};

const asOfDate = '06/18/2026';

const periods: Array<{ key: PeriodKey; label: string; csv: string }> = [
  { key: 'week', label: '1 Week', csv: '1 wk' },
  { key: 'month', label: '1 Month', csv: '1 mo' },
  { key: 'quarter', label: '3 Months', csv: '3 mo' },
  { key: 'halfYear', label: '6 Months', csv: '6 mo' },
  { key: 'year', label: '1 Year', csv: '1 yr' },
];

const parseCsv = (text: string): SectorRow[] => {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((header) => header.trim());

  return lines.map((line) => {
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
  const [rows, setRows] = useState<SectorRow[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'week', direction: 'desc' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/data/sector_perf.csv')
      .then((response) => {
        if (!response.ok) throw new Error('Unable to load sector performance data.');
        return response.text();
      })
      .then((csv) => setRows(parseCsv(csv)))
      .catch((err: Error) => setError(err.message));
  }, []);

  const filteredRows = useMemo(() => {
    return rows
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
  }, [query, rows, sort]);

  const stats = useMemo(() => {
    if (rows.length === 0) return null;
    const leader = rows.reduce((best, row) => (row.week > best.week ? row : best), rows[0]);
    const laggard = rows.reduce((worst, row) => (row.week < worst.week ? row : worst), rows[0]);
    const breadth = rows.filter((row) => row.week > 0).length;

    return { leader, laggard, breadth };
  }, [rows]);

  const updateSort = (key: keyof SectorRow) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  return (
    <main className="page-shell">
      <section className="masthead" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Market dashboard</p>
          <h1 id="page-title">Sector Performance</h1>
          <p className="lede">
            Relative strength across sector and thematic ETFs, ranked by short-term momentum.
          </p>
        </div>
        <div className="as-of">
          <CalendarDays aria-hidden="true" size={18} />
          <span>As of {asOfDate}</span>
        </div>
      </section>

      {stats && (
        <section className="summary-grid" aria-label="Weekly market summary">
          <article>
            <span>1W leader</span>
            <strong>{stats.leader.symbol}</strong>
            <em className={valueClass(stats.leader.week)}>{formatPercent(stats.leader.week)}</em>
          </article>
          <article>
            <span>Positive breadth</span>
            <strong>
              {stats.breadth}/{rows.length}
            </strong>
            <em>{Math.round((stats.breadth / rows.length) * 100)}% above zero</em>
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
            <p className="eyebrow">Performance matrix</p>
            <h2 id="table-title">ETF returns by horizon</h2>
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
                  <th scope="col">
                    <button type="button" onClick={() => updateSort('symbol')}>
                      Symbol <ArrowDownUp aria-hidden="true" size={15} />
                    </button>
                  </th>
                  {periods.map((period) => (
                    <th key={period.key} scope="col">
                      <button type="button" onClick={() => updateSort(period.key)}>
                        {period.label} <ArrowDownUp aria-hidden="true" size={15} />
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
