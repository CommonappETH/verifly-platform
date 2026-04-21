import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verifly · Platform" },
      { name: "description", content: "Verifly Student Connect — multi-portal platform." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-6">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-900 text-zinc-50">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Verifly Student Connect</h1>
        <p className="mt-3 text-slate-600">
          Multi-portal platform connecting students, universities, banks and counselors.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-50 shadow transition-colors hover:bg-zinc-800"
          >
            Open Admin Portal <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
