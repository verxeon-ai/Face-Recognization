export function Footer({ localIp }: { localIp?: string }) {
  return (
    <footer className="mt-auto border-t border-aegis-border bg-aegis-bg">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 text-[11px] text-aegis-muted lg:px-6">
        <div className="font-medium tracking-wide">AegisAI · Video Threat Defense</div>
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span>Endpoint: {localIp || "127.0.0.1"}:5001</span>
          <span>UI: :3000</span>
          <span>Phone HTTPS: :5443</span>
          <span className="inline-flex items-center gap-1.5 text-aegis-green">
            <span className="h-1.5 w-1.5 rounded-full bg-aegis-green" />
            Active
          </span>
        </div>
      </div>
    </footer>
  );
}
