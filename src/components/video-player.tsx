"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface VideoPlayerProps {
  pitchId: string;
  className?: string;
}

export function VideoPlayer({ pitchId, className = "" }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!pitchId) return;

    const hlsUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/elevator-pitch/stream/${pitchId}`;
    console.log("Loading HLS from:", hlsUrl);

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr: XMLHttpRequest) => {
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
        },
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS error:", data);
      });

      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native support
      video.src = hlsUrl;
    }
  }, [pitchId, token]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        className="w-full h-full rounded-lg"
        poster="/placeholder.svg?height=300&width=500"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
