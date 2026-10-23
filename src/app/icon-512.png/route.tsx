import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1d6f5c",
        }}
      >
        <svg width="300" height="300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 2 3 7v2h18V7l-9-5Zm-7 9v8H4v2h16v-2h-1v-8h-2v8h-3v-6H10v6H7v-8H5Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
