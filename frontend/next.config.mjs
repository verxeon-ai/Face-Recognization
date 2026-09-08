/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backend = process.env.FLASK_ORIGIN || "http://127.0.0.1:5001";
    return [
      { source: "/api/threat_status", destination: `${backend}/api/threat_status` },
      { source: "/api/incidents", destination: `${backend}/api/incidents` },
      { source: "/api/verify_incident", destination: `${backend}/api/verify_incident` },
      { source: "/api/delete_incidents", destination: `${backend}/api/delete_incidents` },
      { source: "/api/update_rules", destination: `${backend}/api/update_rules` },
      { source: "/api/rules", destination: `${backend}/api/rules` },
      { source: "/api/dispatch_test_alert", destination: `${backend}/api/dispatch_test_alert` },
      { source: "/api/auth/:path*", destination: `${backend}/api/auth/:path*` },
      { source: "/api/phone_status", destination: `${backend}/api/phone_status` },
      { source: "/api/stream_phone_frame", destination: `${backend}/api/stream_phone_frame` },
      { source: "/api/alerts", destination: `${backend}/api/alerts` },
      { source: "/api/stats", destination: `${backend}/api/stats` },
      { source: "/api/local_ip", destination: `${backend}/api/local_ip` },
      { source: "/api/health", destination: `${backend}/api/health` },
      { source: "/api/persons/:name*", destination: `${backend}/api/persons/:name*` },
      { source: "/dataset/known_persons/:path*", destination: `${backend}/dataset/known_persons/:path*` },
      { source: "/threat_video_feed", destination: `${backend}/threat_video_feed` },
      { source: "/threat_video_feed/:camId", destination: `${backend}/threat_video_feed/:camId` },
      { source: "/video_feed", destination: `${backend}/video_feed` },
      { source: "/phone_stream", destination: `${backend}/phone_stream` },
      { source: "/upload_phone_frame", destination: `${backend}/upload_phone_frame` },
      { source: "/video_progress/:jobId", destination: `${backend}/video_progress/:jobId` },
      { source: "/results/:path*", destination: `${backend}/results/:path*` },
    ];
  },
};

export default nextConfig;
