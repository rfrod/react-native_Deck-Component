import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Animated,
    PanResponder,
    Dimensions,
    StyleSheet,
    LayoutAnimation,
    UIManager
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width
const SWIPE_THRESHOLD = 0.4 * SCREEN_WIDTH;
const SWIPE_DURATION = 250;

if (Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Deck = (props) => {
    const [currentIndex, setCurrendIndex] = useState(0);

    const position = useRef(new Animated.ValueXY()).current;

    useEffect(() => {
        setCurrendIndex(0);
      }, [props.data]);

    const resetPosition = () => {
        Animated.spring(
            position, {
                toValue: {
                    x: 0, 
                    y: 0
                },
                useNativeDriver: false
            }
        ).start();
    };

    const onForceSwipeComplete = (direction) => {
        const {onSwipeLeft, onSwipeRight, data} = props;
        const item = data[currentIndex];

        direction === 'left' ? onSwipeLeft(item) : onSwipeRight(item);

        position.setValue({x: 0, y: 0});
        setCurrendIndex((prevIndex) => prevIndex + 1);
    }

    const forceSwipe = (direction) => {
        const to_x = direction === 'right' 
            ? SCREEN_WIDTH 
            : -SCREEN_WIDTH;
        
        Animated.timing(
            position, {
                toValue: {
                    x: to_x, 
                    y: 0
                },
                duration: SWIPE_DURATION,
                useNativeDriver: false
            }
        ).start( ({finished}) => {
            if(finished){
                LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                onForceSwipeComplete(direction);
            }
        });
    };

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (event, gesture) => {
            position.setValue({x: gesture.dx,y: gesture.dy});
        },
        onPanResponderRelease: (event, gesture) => {
            if(gesture.dx > SWIPE_THRESHOLD) {
                forceSwipe('right');
            } else if(gesture.dx < -SWIPE_THRESHOLD){
                forceSwipe('left');
            } else {
                resetPosition();
            }
        }
    })).current;

    const getCardStyle = () => {
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH*1.5,0,SCREEN_WIDTH*1.5],
            outputRange: [ '-120deg', '0deg', '120deg']
        });

        return {
            ...position.getLayout(),
            transform: [{rotate}]
        };
    }
    
    const renderCards = () => {
        if(currentIndex >= props.data.length){
            return props.onEmptyDeck();
        }
        return props.data.map((item, index) => {
            if(index === currentIndex){
                return (
                    <Animated.View
                        key={item.id} 
                        style={[getCardStyle(),styles.card]}
                        {...panResponder.panHandlers}
                    >
                        {props.renderCard(item)}
                    </Animated.View>
                );
            }else if(index > currentIndex){
                return (
                    <Animated.View 
                        key={item.id} 
                        style={[styles.card, {top: 8 * (index-currentIndex)}]}
                    >
                        {props.renderCard(item)}
                    </Animated.View>);
            } else {
                return null;
            }
        }).reverse();
    }

    return (
        <View>
            {renderCards()}
        </View>
    );
}

Deck.defaultProps = {
    onSwipeLeft: () => {},
    onSwipeRight: () => {},
    onEmptyDeck: () => {}
}

const styles = StyleSheet.create({
    card: {
        position: 'absolute',
        width: SCREEN_WIDTH
    }
});

export default Deck;