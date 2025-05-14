import { InstagramAuth } from "utils/InstagramAuth";
import { redditAuth } from "utils/RedditAuth";
import { XAuth } from "utils/XAuth";
import { YoutubeAuth } from "utils/YoutubeAuth";

export const handleSocialConnect = async (
  platform: string,
  shouldConnect: boolean // <-- Add this argument
): Promise<boolean> => {
  switch (platform) {
    case "reddit":
      return await redditAuth(shouldConnect);
    case "twitter":
      return await XAuth(shouldConnect);
    case "youtube":
      return await YoutubeAuth(shouldConnect);
    case "instagram":
      return await InstagramAuth(shouldConnect);
    default:
      console.warn(`No auth handler for ${platform}`);
      return false;
  }
};
