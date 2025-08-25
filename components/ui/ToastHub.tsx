"use client";
import React from "react";

type Toast = { id: string; msg: string; kind?: "success"|"error"|"info" };

export default function ToastHub() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  React.useEffect(() => {
    function onToast(e: any) {
      const t: Toast = { id: crypto.randomUUID(), msg: e.detail?.msg ?? "", kind: e.detail?.kind ?? "info" };
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter(x => x.id !== t.id)), e.detail?.timeout ?? 2500);
    }
    (window as any).addEventListener("toast", onToast);
    return () => (window as any).removeEventListener("toast", onToast);
  }, []);
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map(t => (
        <div key={t.id}
          className={"rounded-[3px] border px-3 py-2 shadow bg-white text-sm " + 
            (t.kind==="success"?"border-green-500":"") + 
            (t.kind==="error"?" border-red-500":"") +
            (t.kind==="info"?" border-blue-500":"")}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
