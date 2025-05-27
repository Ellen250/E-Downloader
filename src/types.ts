export  interface VideoFormat {
  quality: string;
  format: string;
  size: string;
}

export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  formats: VideoFormat[];
  link: string;
  videoId: string;
}
  