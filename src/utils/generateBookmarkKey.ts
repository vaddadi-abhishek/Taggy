const generateBookmarkKey = (item: any): string => {
  return `${item.source}-${item.id || item.url || item.title}`;
};

export default generateBookmarkKey;
