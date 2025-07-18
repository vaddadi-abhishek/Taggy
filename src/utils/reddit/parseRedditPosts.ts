const parseRedditPosts = (items: any[]): any[] => {
  return items.map((item: any, index: number) => {
    const post = item.data;
    const kind = item.kind;

    let isVideo = false;
    let isRedditGif = false;
    let videoUrl: string | null = null;

    if (post.is_video && post.media?.reddit_video) {
      isVideo = true;
      videoUrl =
        post.media.reddit_video.hls_url ||
        post.media.reddit_video.fallback_url ||
        post.media.reddit_video.dash_url;
    } else if (post.preview?.reddit_video_preview?.is_gif) {
      isVideo = true;
      isRedditGif = true;
      videoUrl = post.preview.reddit_video_preview.fallback_url;
    }

    let imageUrls: string[] = [];
    if (post.is_gallery && post.gallery_data && post.media_metadata) {
      imageUrls = post.gallery_data.items
        .map((item: any) =>
          post.media_metadata[item.media_id]?.s?.u?.replaceAll("&amp;", "&")
        )
        .filter(Boolean);
    } else if (post.preview?.images?.[0]?.source?.url) {
      imageUrls = [
        post.preview.images[0].source.url.replaceAll("&amp;", "&"),
      ];
    }

    const permalink = post.permalink
      ? `https://www.reddit.com${post.permalink}`
      : post.link_permalink || post.link_url || null;

    // DEBUG: Print unique IDs and created_utc for sorting/debugging
    // console.log(
    //   `[${index}] ID: ${post.name}, created_utc: ${post.created_utc}, title: ${post.title || post.link_title}`
    // );

    if (kind === "t1") {
      return {
        id: post.name,
        images: undefined,
        video: null,
        isRedditGif: false,
        source: "reddit",
        title: post.link_title || "Comment on Reddit",
        caption: post.body?.substring(0, 150) || "No comment text.",
        tags: ["reddit", post.subreddit || "unknown"],
        url: permalink,
      };
    }

    return {
      id: post.name,
      images: !isVideo ? imageUrls : undefined,
      video: isVideo ? videoUrl : null,
      isRedditGif,
      source: "reddit",
      title: post.title || post.link_title || "Untitled",
      caption: post.selftext?.substring(0, 150) || "No description.",
      tags: ["reddit", post.subreddit],
      url: permalink,
    };
  });
};

export default parseRedditPosts;
