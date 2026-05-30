"use client";

import { useState, useTransition } from "react";
import { loginAction } from "./actions";

interface User {
  id: string;
  name: string;
}

export default function LoginClient({ users }: { users: User[] }) {
  const [selected, setSelected] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function selectUser(user: User) {
    setSelected(user);
    setPin("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || pin.length !== 4) return;
    setError("");
    startTransition(async () => {
      const result = await loginAction(selected.id, pin);
      if (result?.error) {
        setError(result.error);
        setPin("");
      }
    });
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-6">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-white tracking-tight">Mundial 2026</h1>
        <p className="text-zinc-500 text-sm mt-1">Typowanie meczów</p>
      </div>

      {!selected ? (
        <div className="w-full max-w-sm space-y-3">
          <p className="text-zinc-400 text-center text-sm font-medium mb-5">Kim jesteś?</p>
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => selectUser(user)}
              className="w-full py-4 px-6 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white text-lg font-semibold rounded-2xl transition-all"
            >
              {user.name}
            </button>
          ))}
          {users.length === 0 && (
            <p className="text-zinc-600 text-center text-sm">Brak użytkowników</p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            ← Wróć
          </button>

          <div className="text-center py-2">
            <p className="text-white text-2xl font-bold">{selected.name}</p>
            <p className="text-zinc-400 text-sm mt-1">Podaj swój 4-cyfrowy PIN</p>
          </div>

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            autoFocus
            className="w-full py-5 px-6 bg-zinc-800 text-white text-3xl text-center rounded-2xl outline-none focus:ring-2 focus:ring-green-500 tracking-[0.4em] font-mono"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={pin.length !== 4 || isPending}
            className="w-full py-4 bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-lg font-bold rounded-2xl transition-colors"
          >
            {isPending ? "Logowanie…" : "Wejdź"}
          </button>
        </form>
      )}
    </div>
  );
}
