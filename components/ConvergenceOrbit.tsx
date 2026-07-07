export default function ConvergenceOrbit({ size = 220 }: { size?: number }) {
  const core = size * 0.26;
  const nodeSize = size * 0.11;
  const radius = size * 0.36;

  const nodes = [
    { color: "var(--sms)", delay: "0s" },
    { color: "var(--email)", delay: "-2.33s" },
    { color: "var(--whatsapp)", delay: "-4.66s" },
  ];

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden="true">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: "radial-gradient(circle, var(--primary-glow), transparent 65%)" }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: core,
          height: core,
          left: "50%",
          top: "50%",
          marginLeft: -core / 2,
          marginTop: -core / 2,
          background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
          animation: "core-pulse 3.2s ease-in-out infinite",
        }}
      />
      {nodes.map((n, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{ animation: `spin-orbit 7s linear infinite`, animationDelay: n.delay }}
        >
          <div
            className="absolute rounded-full"
            style={{
              width: nodeSize,
              height: nodeSize,
              left: "50%",
              top: size / 2 - radius,
              marginLeft: -nodeSize / 2,
              background: n.color,
              boxShadow: `0 0 10px 2px ${n.color}`,
            }}
          />
        </div>
      ))}
    </div>
  );
}