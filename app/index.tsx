import globalStyles from '@/app/src/styles/globalStyles';
import { Link } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function index() {
  return (
    <View style={globalStyles.container}>
      <View style={styles.viewText}>
        <Text style={styles.welcomeText}>Let's</Text>
        <Text style={styles.welcomeText}>Go</Text>
        <Text style={styles.paraText}>
          sailing across social media for saved posts.
        </Text>
      </View>

      <View style={styles.btnWrapper}>
        <Link href="./src/(screens)/Home" asChild>
          <TouchableOpacity style={styles.btnStyles}>
            <Image
              source={{ uri: 'https://img.icons8.com/3d-fluency/375/google-logo.png' }}
              style={styles.btnImg}
            />
            <Text style={styles.btnText}>Login with Google</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewText: {
    flex: 1,
    justifyContent: 'center',
    paddingStart: 44,
  },
  welcomeText: {
    fontWeight: '800',
    fontSize: 48,
  },
  paraText: {
    width: 100,
  },
  btnWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 50,
  },
  btnStyles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 21,
    borderRadius: 25,
    backgroundColor: '#3573D1',
  },
  btnImg: {
    width: 20,
    height: 20,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '300',
  },
});
