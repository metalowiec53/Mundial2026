export default function ScoringRules() {
  return (
    <div className="bg-zinc-800/60 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-700/50">
        <h2 className="text-sm font-semibold text-zinc-300">Zasady punktowania</h2>
      </div>

      <div className="px-4 py-3 space-y-4">
        {/* Group stage */}
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Faza grupowa
          </p>
          <div className="space-y-1.5">
            <Row label="Dokładny wynik" pts="3 pkt" color="text-green-400" />
            <Row label="Trafiony zwycięzca lub remis" pts="1 pkt" color="text-zinc-300" />
            <Row label="Błędny typ" pts="0 pkt" color="text-zinc-600" />
          </div>
        </div>

        <div className="h-px bg-zinc-700/40" />

        {/* Knockout stage */}
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Faza pucharowa
          </p>
          <div className="space-y-1.5">
            <Row label="Dokładny wynik po dogrywce" pts="3 pkt" color="text-green-400" />
            <Row label="Trafiony zwycięzca meczu" pts="1 pkt" color="text-zinc-300" />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-zinc-500">Oba trafione — łącznie</span>
              <span className="text-xs font-bold text-amber-400 shrink-0">4 pkt</span>
            </div>
            <p className="text-[10px] text-zinc-600 leading-tight">
              Zwycięzca = drużyna, która awansuje (regulamin / dogrywka / karne).
            </p>
          </div>
        </div>

        <div className="h-px bg-zinc-700/40" />

        {/* Bonuses */}
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Bonusy
          </p>
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <span>🔥</span> Passa (3+ poprawnych z rzędu)
                </span>
                <span className="text-xs font-bold text-orange-400 shrink-0">+1 pkt</span>
              </div>
              <p className="text-[10px] text-zinc-600 leading-tight mt-0.5">
                Do każdego kolejnego poprawnego typu, dopóki passa trwa.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-xs text-zinc-400">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 rounded">G</span>
                  Pakiet grupowy — cała grupa
                </span>
                <span className="text-xs font-bold text-emerald-400 shrink-0">+5 pkt</span>
              </div>
              <p className="text-[10px] text-zinc-600 leading-tight mt-0.5">
                Za trafienie zwycięzcy/remisu we wszystkich meczach grupy.
              </p>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <span>⚡</span> Doładowanie x2
              </span>
              <span className="text-xs font-bold text-amber-400 shrink-0">×2</span>
            </div>
            <p className="text-[10px] text-zinc-600 leading-tight -mt-1">
              1 użycie na turniej, dostępne od fazy pucharowej. Podwaja punkty za wybrany mecz.
            </p>
          </div>
        </div>

        <div className="h-px bg-zinc-700/40" />

        {/* Special bet */}
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Typ specjalny
          </p>
          <Row label="Trafiony zwycięzca mundialu" pts="+10 pkt" color="text-yellow-400" />
        </div>

        <div className="h-px bg-zinc-700/40" />

        {/* Badges */}
        <div>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">
            Odznaki (bez punktów)
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <span>🎯</span> Snajper
              </span>
              <span className="text-[10px] text-zinc-500">licznik dokładnych wyników</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, pts, color }: { label: string; pts: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-zinc-400">{label}</span>
      <span className={`text-xs font-bold shrink-0 ${color}`}>{pts}</span>
    </div>
  );
}
