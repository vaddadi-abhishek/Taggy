export const YoutubeAuth = async (shouldConnect: boolean): Promise<boolean> => {
  if (shouldConnect) {
    console.log("🔗 Youtube connecting...");
    // perform auth logic here...
    return true; // connected
  } else {
    console.log("🔌 Youtube disconnecting...");
    // handle disconnect logic here...
    return true; // disconnected
  }
};
