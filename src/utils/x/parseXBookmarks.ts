const parseXBookmarks = (json: any): any[] => {
  const tweets = json.data || [];
  const mediaMap: Record<string, any> = {};
  const media = json.includes?.media || [];

  for (const m of media) {
    mediaMap[m.media_key] = m;
  }

  return tweets.map((tweet: any) => {
    const tweetMedia = tweet.attachments?.media_keys?.map((key: string) => mediaMap[key]) || [];

    const imageUrls = tweetMedia
      .filter((m) => m.type === "photo")
      .map((m) => m.url);

    const videoMedia = tweetMedia.find((m) => m.type === "video" || m.type === "animated_gif");
    const videoUrl = videoMedia?.preview_image_url || null;

    return {
      id: tweet.id,
      source: "twitter",
      title: tweet.text.substring(0, 100) || "Untitled",
      caption: tweet.text.substring(0, 150) || "No description.",
      images: imageUrls.length > 0 ? imageUrls : undefined,
      video: videoMedia ? videoUrl : null,
      isRedditGif: false,
      tags: ["twitter"],
      url: `https://x.com/i/web/status/${tweet.id}`,
    };
  });
};

export default parseXBookmarks;
