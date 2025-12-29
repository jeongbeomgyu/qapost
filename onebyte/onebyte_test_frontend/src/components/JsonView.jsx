export default function JsonView({ title, data }) {
    if (data == null) return null;
    return (
      <div style={{ marginTop: 12 }}>
        {title && <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>}
        <pre style={{ padding: 12, background: "#f5f5f5", overflowX: "auto" }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }
  