export const createVideoSchema: any = {
  type: "object",
  properties: {
    url: {
      type: "string",
      pattern:
        "^https?://(www\\.)?(youtube\\.com/watch\\?.*v=|youtu\\.be/|youtube\\.com/shorts/)[a-zA-Z0-9_-]{11}",
    },
    title: { type: "string" },
  },
  required: ["url"],
  additionalProperties: false,
};
