export const XAuth = async (shouldConnect: boolean): Promise<boolean> => {
  if (shouldConnect) {
    console.log("🔗 X connecting...");
    // perform auth logic here...
    return true; // connected
  } else {
    console.log("🔌 X disconnecting...");
    // handle disconnect logic here...
    return true; // disconnected
  }
};
