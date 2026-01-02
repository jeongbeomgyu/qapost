import { FileText, FolderTree } from "lucide-react";

export function HeroBanner() {
  return (
    <section className="relative bg-gradient-to-br from-[#e8f5e9] via-[#f1f8f4] to-white overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-8 py-20">
        <div className="grid grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="max-w-3xl">
            <h1 className="text-6xl md:text-7xl font-semibold tracking-[-0.04em] leading-[1.5] text-foreground">
              개발자들이 모여
              <br />
              <span className="text-primary">
                지식을 키우는
              </span>{" "}
              숲
            </h1>

            <p className="mt-7 text-lg md:text-xl leading-relaxed text-muted-foreground max-w-2xl">
              당신의 고민이 대화가 되는 순간, 지식은 숲처럼
              울창해집니다.
            </p>
          </div>

          {/* Right Illustration - Minimal Tree Forest */}
          <div className="relative h-[320px] flex items-center justify-center">
            <svg
              viewBox="0 0 500 320"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Abstract Tree Forms - Sculptural */}

              {/* Tree 1 - Left, shorter */}
              <g opacity="0.85">
                {/* Trunk suggestion */}
                <path
                  d="M 80 280 L 85 260 L 95 260 L 100 280 Z"
                  fill="#4a5f4e"
                />
                {/* Canopy - abstract triangular form with slight curve */}
                <path
                  d="M 50 260 L 87.5 180 Q 90 175 92.5 180 L 130 260 Z"
                  fill="#3d6e4f"
                  opacity="0.9"
                />
                {/* Secondary layer for depth */}
                <path
                  d="M 60 240 L 90 190 L 120 240 Z"
                  fill="#2d5a3d"
                  opacity="0.3"
                />
              </g>

              {/* Tree 2 - Center-left, medium */}
              <g opacity="0.9">
                {/* Trunk */}
                <path
                  d="M 185 290 L 190 240 L 210 240 L 215 290 Z"
                  fill="#4a5f4e"
                />
                {/* Canopy - layered abstract forms */}
                <path
                  d="M 140 240 L 200 140 L 260 240 Z"
                  fill="#3d6e4f"
                />
                <path
                  d="M 155 220 L 200 155 L 245 220 Z"
                  fill="#508663"
                  opacity="0.6"
                />
                <path
                  d="M 170 200 L 200 165 L 230 200 Z"
                  fill="#2d5a3d"
                  opacity="0.25"
                />
              </g>

              {/* Tree 3 - Center-right, tallest (focal) */}
              <g>
                {/* Trunk with subtle taper */}
                <path
                  d="M 295 290 L 300 200 L 320 200 L 325 290 Z"
                  fill="#4a5f4e"
                />
                {/* Main canopy - tall abstract form */}
                <path
                  d="M 230 200 L 310 60 L 390 200 Z"
                  fill="#2d5a3d"
                />
                {/* Mid layer */}
                <path
                  d="M 250 180 L 310 85 L 370 180 Z"
                  fill="#3d6e4f"
                  opacity="0.7"
                />
                {/* Inner layer */}
                <path
                  d="M 270 160 L 310 100 L 350 160 Z"
                  fill="#508663"
                  opacity="0.4"
                />
                {/* Top accent */}
                <path
                  d="M 290 130 L 310 95 L 330 130 Z"
                  fill="#5a8f69"
                  opacity="0.3"
                />
              </g>

              {/* Tree 4 - Right, medium-short */}
              <g opacity="0.88">
                {/* Trunk */}
                <path
                  d="M 405 288 L 410 230 L 430 230 L 435 288 Z"
                  fill="#4a5f4e"
                />
                {/* Canopy */}
                <path
                  d="M 370 230 L 420 160 L 470 230 Z"
                  fill="#3d6e4f"
                />
                <path
                  d="M 385 215 L 420 175 L 455 215 Z"
                  fill="#4a7c59"
                  opacity="0.5"
                />
              </g>

              {/* Ground plane suggestion - very subtle */}
              <line
                x1="0"
                y1="290"
                x2="500"
                y2="290"
                stroke="#2d5a3d"
                strokeWidth="1"
                opacity="0.1"
              />

              {/* Subtle background shapes for depth */}
              <path
                d="M 0 250 Q 100 240 200 245 T 400 250 L 500 260 L 500 320 L 0 320 Z"
                fill="#e8f5e9"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 right-20 w-20 h-20 rounded-full bg-[#81c784] opacity-10"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-[#2d5a3d] opacity-5"></div>
    </section>
  );
}