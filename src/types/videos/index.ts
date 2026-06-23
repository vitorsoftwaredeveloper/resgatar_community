interface IVideo {
  _id: string;
  memberId: string;
  url: string;
  videoId: string;
  title?: string;
}

interface IVideoWithMember {
  _id: string;
  memberId: string;
  videoId: string;
  thumbnail: string;
  url: string;
  title?: string;
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export { IVideo, IVideoWithMember };
