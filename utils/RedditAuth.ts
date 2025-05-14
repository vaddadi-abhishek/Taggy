export const redditAuth = async (shouldConnect: boolean): Promise<boolean> => {
  if (shouldConnect) {
    console.log("🔗 Reddit connecting...");
    // perform auth logic here...
    return true;
  } else {
    console.log("🔌 Reddit disconnecting...");
    // handle disconnect logic here...
    return true; // ✅ return true to allow UI to update
  }
};
