interface Props {
  url: string;
}

export const BrowserView = ({ url }: Props) => {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        overflow: "hidden",
        marginTop: 16,
        background: "#f9f9f9",
      }}
    >
      <div
        style={{
          background: "#eee",
          padding: 8,
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#f66",
            marginRight: 4,
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#fc3",
            marginRight: 4,
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#6c6",
            marginRight: 8,
          }}
        />
        <input
          value={url}
          readOnly
          style={{
            flex: 1,
            border: "none",
            background: "#eee",
            padding: 4,
            borderRadius: 4,
          }}
        />
      </div>
      <iframe
        src={url}
        style={{
          width: "100%",
          height: 500,
          border: "none",
          background: "#fff",
        }}
        title="Browser Preview"
      />
    </div>
  );
};
