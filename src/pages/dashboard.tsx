import { getSession, signOut } from "next-auth/react";
import useSWR from "swr";
import { useMemo, useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export async function getServerSideProps(ctx: any) {
  const session = await getSession(ctx);

  if (!session) {
    return {
      redirect: {
        destination: "/api/auth/signin",
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
  const pageSize = 20;

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
        String(r.email ?? "").toLowerCase().includes(query);

      const matchesSport =
        sportFilter === "All" ||
        (Array.isArray(r.selectedSports) &&
          r.selectedSports.includes(sportFilter));

      return matchesQuery && matchesSport;
    });
  }, [respondents, q, sportFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-10 border-b bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              1st Bagong Cabuyao Inter-High Sports Meet
            </h1>
            <p className="text-sm text-gray-600">Voting Dashboard</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium">{session?.user?.email}</p>
              <p className="text-xs text-gray-500">Supervisor access only</p>
            </div>

            <button
              className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
              onClick={() => signOut()}
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {isLoading && <p className="text-gray-600">Loading...</p>}
        {error && (
          <p className="text-red-600">Failed to load dashboard data.</p>
        )}

        {data && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border p-4 shadow-sm">
                <p className="text-sm text-gray-600">As of</p>
                <p className="mt-1 text-base font-semibold">
                  {data.asOf ?? "—"}
                </p>
              </div>

              <div className="rounded-2xl border p-4 shadow-sm">
                <p className="text-sm text-gray-600">Total responses</p>
                <p className="mt-1 text-base font-semibold">
                  {data.totalResponses ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border p-4 shadow-sm">
                <p className="text-sm text-gray-600">Sports options</p>
                <p className="mt-1 text-base font-semibold">
                  {ranking.length}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold">Ranking</h2>

                  <button
                    className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => location.reload()}
                    title="Manual refresh"
                  >
                    Refresh
                  </button>
                </div>

                <div className="overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Rank</th>
                        <th className="px-3 py-2 text-left">Sport</th>
                        <th className="px-3 py-2 text-right">Votes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ranking.map((r: any, i: number) => (
                        <tr key={r.sport} className="border-t">
                          <td className="px-3 py-2">{i + 1}</td>
                          <td className="px-3 py-2 font-medium">{r.sport}</td>
                          <td className="px-3 py-2 text-right">{r.votes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-2xl border p-4 shadow-sm">
                <h2 className="text-base font-semibold">Respondents</h2>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2"
                    placeholder="Search school or email..."
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPage(1);
                    }}
                  />

                  <select
                    className="w-full rounded-xl border px-3 py-2 text-sm sm:w-56"
                    value={sportFilter}
                    onChange={(e) => {
                      setSportFilter(e.target.value);
                      setPage(1);
                    }}
                  >
                    {sports.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="mt-3 text-sm text-gray-600">
                  Showing <b>{filtered.length}</b> result(s)
                </p>

                <div className="mt-3 overflow-hidden rounded-xl border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Timestamp</th>
                        <th className="px-3 py-2 text-left">School</th>
                        <th className="px-3 py-2 text-left">Principal</th>
                        <th className="px-3 py-2 text-left">Coordinator</th>
                        <th className="px-3 py-2 text-left">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((r: any, i: number) => (
                        <tr key={i} className="border-t align-top">
                          <td className="px-3 py-2">{r.timestamp}</td>
                          <td className="px-3 py-2">
                            <div className="font-medium">{r.school}</div>
                            <div className="text-xs text-gray-500">
                              {r.schoolType}
                            </div>
                          </td>
                          <td className="px-3 py-2">{r.principal}</td>
                          <td className="px-3 py-2">{r.coordinator}</td>
                          <td className="px-3 py-2">{r.email}</td>
                        </tr>
                      ))}

                      {paged.length === 0 && (
                        <tr>
                          <td
                            className="px-3 py-6 text-center text-gray-500"
                            colSpan={5}
                          >
                            No results.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>

                  <p className="text-sm text-gray-600">
                    Page <b>{page}</b> of <b>{totalPages}</b>
                  </p>

                  <button
                    className="rounded-xl border px-3 py-2 text-sm disabled:opacity-50"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}