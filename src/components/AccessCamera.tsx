"use client";
import { useEffect, useRef } from "react";

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Start camera
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      if (videoRef.current) videoRef.current.srcObject = stream;
    });

    // Send frame every 2 seconds
    const interval = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) return;

      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);

      if (imgRef.current) imgRef.current.src = canvas.toDataURL("image/png");

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const formData = new FormData();
        formData.append("file", blob, "frame.jpg");
        await fetch("http://127.0.0.1:8000/detect", {
          method: "POST",
          body: formData,
        });
      }, "image/jpeg");
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-10 flex flex-col gap-5">
      <video ref={videoRef} autoPlay playsInline className="w-150 aspect-video object-cover border rounded" />
      <canvas ref={canvasRef} className="hidden" />
      <img ref={imgRef} className="w-full max-w-175 rounded-lg border" />
    </div>
  );
}