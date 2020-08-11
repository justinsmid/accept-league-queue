import React from 'react';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import Home from './Home';
import QueuePage from './QueuePage';

const Drawer = createDrawerNavigator();

export default () => {
    return (
        <NavigationContainer>
            <Drawer.Navigator initialRouteName='queue'>
                <Drawer.Screen name='home' component={Home} />
                <Drawer.Screen name='queue' component={QueuePage} />
            </Drawer.Navigator>
        </NavigationContainer>
    );
};