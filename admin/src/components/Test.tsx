import React from "react";

const DriveVideoPlayerSimple = () => {
  const fileId = "1e7mfbzYJtysGVf80yCSOxQmkFSz_9jHw";
  const embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
      <iframe
        src={"https://www.facebook.com/reel/1553485142356189"}
        width="640"
        height="360"
        allow="autoplay; encrypted-media"
        allowFullScreen
        style={{ border: "none", borderRadius: "8px", backgroundColor: "#000" }}
        title="Google Drive Video"
      />
    </div>
  );
};

export default DriveVideoPlayerSimple;
