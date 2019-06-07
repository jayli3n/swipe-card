import React, { Component } from 'react';
import { View, Animated, PanResponder, Dimensions, LayoutAnimation, UIManager } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25*SCREEN_WIDTH;

class Deck extends Component {
	static defaultProps = {
      onSwipeRight: () => {},
      onSwipeLeft: () => {},
      renderNoMoreCards: () => {}
	}

	constructor(props) {
		super(props);
		this.position = new Animated.ValueXY();
		this.panResponder = PanResponder.create({
			onStartShouldSetPanResponder: () => {
				return true;
			},
			onPanResponderMove: (event, gesture) => {
				this.position.setValue({
					x: gesture.dx,
					y: gesture.dy
				})
			},
			onPanResponderRelease: (evemt, gesture) => {
				if (gesture.dx > SWIPE_THRESHOLD) {
					this.forceSwipeOut(isLeft=false);
				} else if (gesture.dx < -SWIPE_THRESHOLD) {
					this.forceSwipeOut(isLeft=true);
				} else {
					this.resetPosition();
				}
			}
		});

		this.state = {
			index: 0
		}
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.data !== this.props.data) {
			this.setState({index: 0})
		}
	}

	componentWillUpdate() {
		UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
		LayoutAnimation.spring();
	}

	forceSwipeOut(isLeft=true) {
		Animated.timing(this.position, {
			toValue: {
				x: isLeft ? -SCREEN_WIDTH : SCREEN_WIDTH,
				y: 0
			},
			duration: 250
		}).start(() => this.onSwipeComplete(isLeft));
	}

	onSwipeComplete(isLeft) {
		const { onSwipeRight, onSwipeLeft, data } = this.props;
		const item = data[this.state.index];
		isLeft ? onSwipeLeft(item) : onSwipeRight(item);
		this.position.setValue({
			x: 0,
			y: 0
		});
		this.setState({
			index: this.state.index+1
		});
	}

	resetPosition() {
		Animated.spring(this.position, {
			toValue: {
				x: 0,
				y: 0
			}
		}).start();
	}

	getCardStyle() {
		const rotate = this.position.x.interpolate({
			inputRange: [-SCREEN_WIDTH*1.5, 0, SCREEN_WIDTH*1.5],
			outputRange: ['-120deg', '0deg', '120deg']
		});

		return  {
			...this.position.getLayout(),
			transform: [{
				rotate
			}]
		}
	}

	renderCards() {
		const { data, renderCard, renderNoMoreCards } = this.props;
		if (this.state.index >= data.length) {
			return renderNoMoreCards();
		}

		return (
			data.map((item, index) => {
				if (index === this.state.index) {
					return (
						<Animated.View
							key={item.id}style={[this.getCardStyle(), styles.cardStyle, {zIndex: index * -1}]}
							
							{...this.panResponder.panHandlers}
						>
							{renderCard(item)}
						</Animated.View>
					)
				} else if (index > this.state.index) {
					return <Animated.View 
								style={[styles.cardStyle, {zIndex: index * -1}, {top: 10*(index - this.state.index)}]}
								key={item.id}
							>
								{renderCard(item)}
							</Animated.View>
				} else {
					return null;
				}
			})
		)
	}

	render() {
		return (
			<View>
				{this.renderCards()}
			</View>
		)
	}
}

const styles = {
	cardStyle: {
		position: 'absolute',
		width: SCREEN_WIDTH
	}
}

export default Deck;