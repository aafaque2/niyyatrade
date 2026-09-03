import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "NiyyaTrade — Trade with Intentions. Invest with Ethics.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "80px",
          backgroundColor: "#0B0F0E",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            color: "#22C55E",
            fontWeight: 600,
            letterSpacing: "0.2em",
          }}
        >
          NIYYATRADE
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 72,
            lineHeight: 1.1,
            color: "#F8FAFC",
            fontWeight: 700,
            marginTop: 24,
          }}
        >
          Trade with Intentions.
          <br />
          Invest with Ethics.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#94A3B8",
            marginTop: 24,
          }}
        >
          $100,000 virtual capital · ESG, Shariah &amp; BDS screening
        </div>
      </div>
    ),
    { ...size },
  );
}
