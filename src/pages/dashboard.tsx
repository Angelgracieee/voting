import { getSession, signOut } from "next-auth/react";
import useSWR from "swr";
import { useMemo, useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export async function getServerSideProps(ctx: any) {
  const session = await getSession(ctx);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}

export default function Dashboard({ session }: any) {
  const { data, error, isLoading } = useSWR("/api/dashboard", fetcher, {
    refreshInterval: 20000,
  });

  const [q, setQ] = useState("");
  const [sportFilter, setSportFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);

  const pageSize = 10;

  const respondents = data?.respondents ?? [];
  const ranking = data?.ranking ?? [];

  const sports = useMemo(() => {
    return ["All", ...ranking.map((r: any) => r.sport)];
  }, [ranking]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return respondents.filter((r: any) => {
      const matchesQuery =
        !query ||
        String(r.name ?? "").toLowerCase().includes(query) ||
        String(r.school ?? "").toLowerCase().includes(query) ||
        String(r.email ?? "").toLowerCase().includes(query) ||
        String(r.principal ?? "").toLowerCase().includes(query) ||
        String(r.coordinator ?? "").toLowerCase().includes(query);

      const matchesSport =
        sportFilter === "All" ||
        (Array.isArray(r.selectedSports) &&
          r.selectedSports.some((s: string) => s === sportFilter));

      return matchesQuery && matchesSport;
    });
  }, [respondents, q, sportFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#312e81,_#111827_38%,_#0f172a_70%,_#020617_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-5 xl:px-6 xl:py-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="rounded-t-[28px] bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-fuchsia-500/20 px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-3xl">
                <h1 className="bg-gradient-to-r from-cyan-300 via-blue-200 to-fuchsia-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent xl:text-4xl">
                  Bagong Cabuyao Inter-High Sports Meet
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  Real-time voting dashboard powered by Google Sheets
                </p>
              </div>

              <div className="flex flex-col items-start gap-2 xl:items-end">
                <div className="rounded-full border border-amber-300/20 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200">
                  Supervisor Access Only
                </div>

                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  {isLoading ? "Syncing live data..." : "Auto-sync every 5 seconds"}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
                    Signed in as:{" "}
                    <span className="font-semibold">{session?.user?.email}</span>
                  </div>

                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="rounded-full border border-red-300/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-400/20"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-cyan-300/20 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.20)] backdrop-blur-xl">
            <p className="text-sm text-slate-300">As of</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {data?.asOf ?? "—"}
            </p>
          </div>

          <div className="rounded-[24px] border border-violet-300/20 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.20)] backdrop-blur-xl">
            <p className="text-sm text-slate-300">Total responses</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {data?.totalResponses ?? 0}
            </p>
          </div>

          <div className="rounded-[24px] border border-fuchsia-300/20 bg-white/5 p-5 shadow-[0_8px_30px_rgba(0,0,0,0.20)] backdrop-blur-xl">
            <p className="text-sm text-slate-300">Categories listed</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {ranking.length}
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white/95">Dashboard Overview</h2>
            <p className="mt-1 text-sm text-slate-300">
              Live ranking and submitted school responses
            </p>
          </div>

          {isLoading && (
            <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
              Loading...
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <section className="h-[600px] rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl flex flex-col">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white/95">Voting Ranking</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Live ranking of sports categories
                </p>
              </div>

              <button
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                onClick={() => location.reload()}
              >
                Refresh
              </button>
            </div>

            {isLoading && <p className="text-slate-300">Loading...</p>}
            {error && (
              <p className="text-red-300">Failed to load dashboard data.</p>
            )}

            {!isLoading && !error && (
              <div className="h-[500px] overflow-y-auto rounded-[24px] border border-white/10 bg-white/5">
                <table className="w-full text-sm">
                  <thead className="bg-white/5 text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left">Rank</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-right">Votes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {ranking.map((r: any, i: number) => (
                      <tr key={r.sport} className="transition hover:bg-white/10">
                        <td className="px-4 py-3 text-slate-200">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-white">
                          {r.sport}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-cyan-200">
                          {r.votes}
                        </td>
                      </tr>
                    ))}

                    {ranking.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-300">
                          No ranking data found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="h-[600px] rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl flex flex-col">
            <div className="mb-5">
              <h2 className="text-xl font-bold text-white/95">Respondents</h2>
              <p className="mt-1 text-sm text-slate-300">
                View and filter submitted school responses
              </p>
            </div>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row">
              <input
                className="w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-300 outline-none transition focus:border-cyan-300/40 focus:bg-white/10"
                placeholder="Search school, principal, coordinator, or email..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />

              <select
                className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/40 focus:bg-white/10"
                value={sportFilter}
                onChange={(e) => {
                  setSportFilter(e.target.value);
                  setPage(1);
                }}
              >
                {sports.map((s) => (
                  <option key={s} value={s} className="text-black">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <p className="mb-4 text-sm text-slate-300">
              Showing <span className="font-semibold text-white">{filtered.length}</span> result(s)
            </p>

            <div className="flex-1 overflow-y-auto rounded-[24px] border border-white/10 bg-white/5">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Timestamp</th>
                    <th className="px-4 py-3 text-left">School</th>
                    <th className="px-4 py-3 text-left">Principal</th>
                    <th className="px-4 py-3 text-left">Coordinator</th>
                    <th className="px-4 py-3 text-left">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {paged.map((r: any, i: number) => (
                    <tr
                      key={i}
                      onClick={() => setSelectedRecord(r)}
                      className="cursor-pointer align-top transition hover:bg-white/10"
                    >
                      <td className="px-4 py-3 text-slate-200">{r.timestamp}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-cyan-200">
                          {r.school}
                        </div>
                        <div className="text-xs text-white-400 font-medium">
                          {r.schoolType || "N/A"} - {r.schoolLevel || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-200">{r.principal}</td>
                      <td className="px-4 py-3 text-slate-200">{r.coordinator}</td>
                      <td className="px-4 py-3 text-slate-200">{r.email}</td>
                    </tr>
                  ))}

                  {paged.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-300">
                        No results found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <button
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>

              <p className="text-sm text-slate-300">
                Page <span className="font-semibold text-white">{page}</span> of{" "}
                <span className="font-semibold text-white">{totalPages}</span>
              </p>

              <button
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </section>
        </div>

        <footer className="mt-10 rounded-[28px] border border-white/10 bg-white/5 px-6 py-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <img
              src="/youth.png"
              alt="Youth Development Affairs Office"
              className="h-12 w-auto object-contain opacity-95"
            />
            <img
              src="/sports.png"
              alt="Sports Logo"
              className="h-12 w-auto object-contain opacity-95"
            />
            <img
              src="/seal.png"
              alt="City Seal"
              className="h-12 w-auto object-contain opacity-95"
            />
            <img
              src="/bagongcabuyao.png"
              alt="Bagong Cabuyao"
              className="h-12 w-auto object-contain opacity-95"
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-slate-300">
              Developed by{" "}
              <span className="font-semibold text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
                A. Fojas
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Voting Dashboard © 2026
            </p>
          </div>
        </footer>
      </div>

      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-slate-950/95 p-6 shadow-[0_8px_40px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {selectedRecord.school}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Submitted voting details
                </p>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Principal
                </p>
                <p className="mt-1 text-sm text-white">
                  {selectedRecord.principal || "N/A"}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Coordinator
                </p>
                <p className="mt-1 text-sm text-white">
                  {selectedRecord.coordinator || "N/A"}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Email
                </p>
                <p className="mt-1 text-sm text-white break-all">
                  {selectedRecord.email || "N/A"}
                </p>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Timestamp
                </p>
                <p className="mt-1 text-sm text-white">
                  {selectedRecord.timestamp || "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[20px] border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Sports Voted For
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {Array.isArray(selectedRecord.selectedSports) &&
                  selectedRecord.selectedSports.length > 0 ? (
                  selectedRecord.selectedSports.map(
                    (sport: string, index: number) => (
                      <span
                        key={index}
                        className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200"
                      >
                        {sport}
                      </span>
                    )
                  )
                ) : (
                  <p className="text-sm text-slate-400">No sports recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}