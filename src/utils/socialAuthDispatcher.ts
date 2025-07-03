import InstagramAuth from "@/src/utils/InstagramAuth";
import redditAuth from "@/src/utils/RedditAuth";
import XAuth from "@/src/utils/XAuth";
import YoutubeAuth from "@/src/utils/YoutubeAuth";

const handleSocialConnect = async (
  platform: string,
  shouldConnect: boolean
): Promise<boolean> => {
  switch (platform) {
    case "reddit":
      return await redditAuth(shouldConnect);
    case "x":
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

export default handleSocialConnect;