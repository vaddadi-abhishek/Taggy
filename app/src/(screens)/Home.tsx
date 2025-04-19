import React from "react";
import { View, Text, StyleSheet, Platform , ScrollView} from "react-native";
import TopHeader from "@/app/src/components/TopHeader";
import BookmarkCard from "../components/BookMarkCard";

const sampleBookmarks = Array.from({ length: 15 }, (_, index) => ({
  id: index,
  image: "https://placehold.co/600x300", // Replace with actual bookmark preview image
  source: index % 4 === 0 ? "instagram" :
          index % 4 === 1 ? "reddit" :
          index % 4 === 2 ? "x" : "youtube",
  title: `Bookmark Title ${index + 1}`,
  caption: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  aiSummary: "This is an AI-generated summary of the bookmark. It gives an overview of the content.",
  tags: ["tech", "ai", "react"],
}));

export default function HomeScreen() {
  const handleSearch = (text: string) => {
    console.log("Searching:", text);
  };

  return (
    <View style={styles.container}>
      <TopHeader onSearchTextChange={handleSearch} />
      <ScrollView>
      <View style={{ paddingBottom: 80 }}>
        {sampleBookmarks.map(bookmark => (
          <BookmarkCard
            key={bookmark.id}
            image={bookmark.image}
            source={bookmark.source}
            title={bookmark.title}
            caption={bookmark.caption}
            aiSummary={bookmark.aiSummary}
            tags={bookmark.tags}
          />
        ))}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
  },
  bodyText: {
    fontSize: 18,
    color: "#333",
  },
});
