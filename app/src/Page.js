import React from 'react';
const {StyleSheet, View} = require("react-native");

export default ({props, children}) => {
    return (
        <View style={styles.container} {...props}>
            {children}
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });