import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { format } from "date-fns";
import { Send, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssignTaskDialog } from "@/components/AssignTaskDialog";
import { fetchBins, fetchDrivers, fetchLatestLocations, fetchTasks, taskState, type BinState } from "@/lib/wm";

const FleetMap = lazy(() => import("@/components/FleetMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Live Map — WasteOps Dashboard" },
      { name: "description", content: "Live map of waste containers, their collection status and truck locations." },
      { property: "og:title", content: "Live Map — WasteOps Dashboard" },
      { property: "og:description", content: "Track containers and trucks in real time and dispatch tasks to drivers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LiveMap,
});

function LiveMap() {
  const qc = useQueryClient();
  const bins = useQuery({ queryKey: ["bins"], queryFn: fetchBins });
  const drivers = useQuery({ queryKey: ["drivers"], queryFn: fetchDrivers });
  const locs = useQuery({ queryKey: ["locs"], queryFn: fetchLatestLocations, refetchInterval: 15000 });
  const tasks = useQuery({ queryKey: ["tasks-all"], queryFn: () => fetchTasks(), refetchInterval: 15000 });
  const [open, setOpen] = useState(false);
  const [binId, setBinId] = useState<number>();

  const states = useMemo(() => {
    const m = new Map<number, BinState>();
    for (const t of tasks.data ?? []) if (!m.has(t.bin_id)) m.set(t.bin_id, taskState(t.status)); // tasks are sorted newest first
    return m;
  }, [tasks.data]);

  const counts = useMemo(() => {
    const c = { collected: 0, pending: 0, failed: 0, none: 0 };
    for (const b of bins.data ?? []) c[states.get(b.bin_id) ?? "none"]++;
    return c;
  }, [bins.data, states]);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayTasks = (tasks.data ?? []).filter((t) => t.task_date === today);

  const refresh = () => qc.invalidateQueries();
  const openAssign = (id?: number) => { setBinId(id); setOpen(true); };

  return (
    <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[1fr_320px]">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Live operations</h1>
            <p className="text-sm text-muted-foreground">Containers and trucks, refreshed every 15 seconds.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="h-4 w-4" /> Refresh</Button>
            <Button size="sm" onClick={() => openAssign()}><Send className="h-4 w-4" /> Send task</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Collected" value={counts.collected} tone="collected" />
          <Stat label="Pending" value={counts.pending} tone="pending" />
          <Stat label="Failed" value={counts.failed} tone="failed" />
          <Stat label="Trucks online" value={locs.data?.length ?? 0} tone="none" />
        </div>
        <div className="h-[560px] overflow-hidden rounded-xl border border-border bg-card">
          <ClientOnly fallback={<div className="grid h-full place-items-center text-muted-foreground">Loading map…</div>}>
            <Suspense fallback={<div className="grid h-full place-items-center text-muted-foreground">Loading map…</div>}>
              <FleetMap bins={bins.data ?? []} states={states} drivers={drivers.data ?? []} locations={locs.data ?? []} onAssign={openAssign} />
            </Suspense>
          </ClientOnly>
        </div>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Legend tone="pending" label="Pending" /><Legend tone="collected" label="Collected" /><Legend tone="failed" label="Failed" /><Legend tone="none" label="No task" />
          <span>Green tag = truck (last known position)</span>
        </div>
      </section>

      <aside className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-display text-lg font-semibold">Today's tasks</h2>
        <p className="mb-3 text-xs text-muted-foreground">{today}</p>
        <ul className="flex max-h-[680px] flex-col gap-2 overflow-auto">
          {todayTasks.length === 0 && <li className="text-sm text-muted-foreground">No tasks scheduled today.</li>}
          {todayTasks.map((t) => {
            const b = bins.data?.find((x) => x.bin_id === t.bin_id);
            const d = drivers.data?.find((x) => x.driver_id === t.driver_id);
            const st = taskState(t.status);
            return (
              <li key={t.task_id} className="rounded-lg border border-border bg-background/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{b?.bin_code ?? `Bin #${t.bin_id}`}</span>
                  <span className={`status-pill status-${st}`}>{t.status}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{d?.username} · {d?.truck_number} · Stop {t.route_order ?? "-"}</p>
              </li>
            );
          })}
        </ul>
      </aside>

      <AssignTaskDialog open={open} onOpenChange={setOpen} bins={bins.data ?? []} drivers={drivers.data ?? []} binId={binId} onDone={refresh} />
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: BinState }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span className={`dot dot-${tone}`} /> {label}
      </div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

function Legend({ tone, label }: { tone: BinState; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={`dot dot-${tone}`} />{label}</span>;
}
