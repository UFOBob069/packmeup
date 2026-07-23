import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Palm + sun mark for Apple home-screen / touch icon. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4A8FE3",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            width: 40,
            height: 40,
            borderRadius: 20,
            background: "#F5D76E",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 26,
            left: 81,
            width: 18,
            height: 78,
            borderRadius: 8,
            background: "#8B5A2B",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 58,
            left: 28,
            width: 124,
            height: 36,
            borderRadius: 999,
            background: "#2F9B6A",
            transform: "rotate(-32deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 58,
            left: 28,
            width: 124,
            height: 36,
            borderRadius: 999,
            background: "#2F9B6A",
            transform: "rotate(32deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 52,
            left: 40,
            width: 100,
            height: 32,
            borderRadius: 999,
            background: "#3CB371",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
