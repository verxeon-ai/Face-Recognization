/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backend = process.env.FLASK_ORIGIN || "http://127.0.0.1:5001";
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/threat_video_feed", destination: `${backend}/threat_video_feed` },
      { source: "/threat_video_feed/:camId", destination: `${backend}/threat_video_feed/:camId` },
      { source: "/video_feed", destination: `${backend}/video_feed` },
      { source: "/phone_stream", destination: `${backend}/phone_stream` },
      { source: "/upload_phone_frame", destination: `${backend}/upload_phone_frame` },
      { source: "/upload_image", destination: `${backend}/upload_image` },
      { source: "/upload_video", destination: `${backend}/upload_video` },
      { source: "/add_person", destination: `${backend}/add_person` },
      { source: "/video_progress/:jobId", destination: `${backend}/video_progress/:jobId` },
      { source: "/results/:path*", destination: `${backend}/results/:path*` },
    ];
  },
};

export default nextConfig;
